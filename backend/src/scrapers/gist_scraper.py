import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from .base_scraper import BaseScraper

class GistScraper(BaseScraper):
    """Scraper for GitHub Gist using GitHub API"""
    
    def __init__(self):
        super().__init__(
            service_id='gist',
            name='GitHub Gist',
            base_url='https://gist.github.com',
            rate_limit=300  # 5 requests per second (GitHub allows more but we're being conservative)
        )
        self.api_base = 'https://api.github.com/gists'
    
    def search(self, search_terms: List[str], file_types: List[str] = None, 
               max_results: int = 100, **kwargs) -> List[Dict[str, Any]]:
        """Search GitHub Gists using the API"""
        results = []
        
        try:
            # GitHub Gist API doesn't have search, so we get recent public gists
            # and filter them locally
            gists = self._get_recent_gists(limit=min(max_results * 3, 300))
            
            for gist_info in gists:
                if len(results) >= max_results:
                    break
                
                # Process each file in the gist
                for filename, file_info in gist_info.get('files', {}).items():
                    if len(results) >= max_results:
                        break
                    
                    content = file_info.get('content', '')
                    if not content:
                        # Try to fetch content if truncated
                        content = self._get_file_content(file_info.get('raw_url', ''))
                        if not content:
                            continue
                    
                    # Check if content matches search terms
                    matched_terms = self._contains_search_terms(
                        content, search_terms, kwargs.get('regex_mode', False)
                    )
                    
                    if not matched_terms:
                        continue
                    
                    # Check file type filter
                    file_type = self._detect_file_type_from_filename(filename)
                    if not self._matches_file_type(content, filename, file_types):
                        continue
                    
                    # Calculate relevance score
                    relevance_score = self._calculate_relevance_score(content, search_terms)
                    
                    result = {
                        'paste_id': f"{gist_info['id']}#{filename}",
                        'url': gist_info['html_url'],
                        'title': gist_info.get('description') or filename,
                        'content_preview': content[:500] + '...' if len(content) > 500 else content,
                        'full_content': content,
                        'file_type': file_type,
                        'matched_terms': matched_terms,
                        'service': self.name,
                        'relevance_score': relevance_score,
                        'file_size': len(content.encode('utf-8')),
                        'created_at': gist_info.get('created_at')
                    }
                    
                    results.append(result)
                    self.logger.info(f"Found match in gist {gist_info['id']}/{filename}: {len(matched_terms)} terms")
        
        except Exception as e:
            self.logger.error(f"Search failed: {e}")
        
        return results
    
    def _get_recent_gists(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent public gists from GitHub API"""
        try:
            gists = []
            per_page = min(100, limit)  # GitHub API max per page is 100
            pages_needed = (limit + per_page - 1) // per_page
            
            for page in range(1, pages_needed + 1):
                params = {
                    'per_page': per_page,
                    'page': page
                }
                
                response = self._make_request(self.api_base + '/public', params=params)
                if not response:
                    break
                
                page_gists = response.json()
                if not page_gists:
                    break
                
                gists.extend(page_gists)
                
                if len(gists) >= limit:
                    break
            
            return gists[:limit]
        
        except Exception as e:
            self.logger.error(f"Failed to get recent gists: {e}")
            return []
    
    def _get_file_content(self, raw_url: str) -> Optional[str]:
        """Get file content from raw URL"""
        try:
            response = self._make_request(raw_url)
            if response and response.status_code == 200:
                return response.text
            return None
        except Exception as e:
            self.logger.error(f"Failed to get file content from {raw_url}: {e}")
            return None
    
    def get_paste_content(self, paste_id: str) -> Optional[str]:
        """Get the content of a specific gist file"""
        try:
            # Parse paste_id which should be in format "gist_id#filename"
            if '#' in paste_id:
                gist_id, filename = paste_id.split('#', 1)
            else:
                gist_id = paste_id
                filename = None
            
            response = self._make_request(f"{self.api_base}/{gist_id}")
            if not response:
                return None
            
            gist_data = response.json()
            files = gist_data.get('files', {})
            
            if filename and filename in files:
                file_info = files[filename]
                content = file_info.get('content', '')
                if not content and file_info.get('raw_url'):
                    content = self._get_file_content(file_info['raw_url'])
                return content
            elif files:
                # Return content of first file if no specific filename
                first_file = next(iter(files.values()))
                content = first_file.get('content', '')
                if not content and first_file.get('raw_url'):
                    content = self._get_file_content(first_file['raw_url'])
                return content
            
            return None
        
        except Exception as e:
            self.logger.error(f"Failed to get gist content for {paste_id}: {e}")
            return None
    
    def _detect_file_type_from_filename(self, filename: str) -> str:
        """Detect file type from filename extension"""
        if '.' in filename:
            extension = filename.split('.')[-1].lower()
            return extension
        return 'txt'

