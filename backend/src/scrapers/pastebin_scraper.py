import json
import time
from typing import List, Dict, Any, Optional
from .base_scraper import BaseScraper

class PastebinScraper(BaseScraper):
    """Scraper for Pastebin.com using their API and web scraping"""
    
    def __init__(self):
        super().__init__(
            service_id='pastebin',
            name='Pastebin.com',
            base_url='https://pastebin.com',
            rate_limit=60  # 1 request per second
        )
        self.api_base = 'https://scrape.pastebin.com/api_scraping.php'
    
    def search(self, search_terms: List[str], file_types: List[str] = None, 
               max_results: int = 100, **kwargs) -> List[Dict[str, Any]]:
        """Search Pastebin using their scraping API and recent pastes"""
        results = []
        
        try:
            # Get recent pastes from Pastebin's scraping API
            recent_pastes = self._get_recent_pastes(limit=min(max_results * 2, 250))
            
            for paste_info in recent_pastes:
                if len(results) >= max_results:
                    break
                
                # Get paste content
                content = self.get_paste_content(paste_info['key'])
                if not content:
                    continue
                
                # Check if content matches search terms
                matched_terms = self._contains_search_terms(
                    content, search_terms, kwargs.get('regex_mode', False)
                )
                
                if not matched_terms:
                    continue
                
                # Check file type filter
                if not self._matches_file_type(content, paste_info.get('syntax', ''), file_types):
                    continue
                
                # Calculate relevance score
                relevance_score = self._calculate_relevance_score(content, search_terms)
                
                result = {
                    'paste_id': paste_info['key'],
                    'url': f"https://pastebin.com/{paste_info['key']}",
                    'title': paste_info.get('title', 'Untitled'),
                    'content_preview': content[:500] + '...' if len(content) > 500 else content,
                    'full_content': content,
                    'file_type': self._detect_file_type(content, paste_info.get('syntax', '')),
                    'matched_terms': matched_terms,
                    'service': self.name,
                    'relevance_score': relevance_score,
                    'file_size': len(content.encode('utf-8')),
                    'created_at': paste_info.get('date')
                }
                
                results.append(result)
                self.logger.info(f"Found match in paste {paste_info['key']}: {len(matched_terms)} terms")
        
        except Exception as e:
            self.logger.error(f"Search failed: {e}")
        
        return results
    
    def _get_recent_pastes(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent pastes from Pastebin's scraping API"""
        try:
            params = {
                'limit': min(limit, 250),  # API limit
                'lang': 'text'  # Focus on text pastes
            }
            
            response = self._make_request(self.api_base, params=params)
            if not response:
                return []
            
            # Parse the response - Pastebin API returns JSON array
            pastes = response.json()
            return pastes if isinstance(pastes, list) else []
        
        except Exception as e:
            self.logger.error(f"Failed to get recent pastes: {e}")
            return []
    
    def get_paste_content(self, paste_id: str) -> Optional[str]:
        """Get the raw content of a paste"""
        try:
            raw_url = f"https://pastebin.com/raw/{paste_id}"
            response = self._make_request(raw_url)
            
            if response and response.status_code == 200:
                return response.text
            
            return None
        
        except Exception as e:
            self.logger.error(f"Failed to get paste content for {paste_id}: {e}")
            return None
    
    def _detect_file_type(self, content: str, syntax_hint: str = '') -> str:
        """Detect file type from content and syntax hint"""
        if syntax_hint:
            # Map Pastebin syntax names to common extensions
            syntax_map = {
                'javascript': 'js',
                'python': 'py',
                'php': 'php',
                'sql': 'sql',
                'json': 'json',
                'xml': 'xml',
                'html': 'html',
                'css': 'css',
                'java': 'java',
                'cpp': 'cpp',
                'c': 'c',
                'bash': 'sh'
            }
            
            if syntax_hint.lower() in syntax_map:
                return syntax_map[syntax_hint.lower()]
        
        # Fallback to content-based detection
        content_lower = content.lower()
        
        if content.strip().startswith('{') and content.strip().endswith('}'):
            return 'json'
        elif '<?php' in content_lower:
            return 'php'
        elif 'def ' in content and 'import ' in content:
            return 'py'
        elif 'function' in content and ('var ' in content or 'const ' in content):
            return 'js'
        elif 'select ' in content_lower or 'insert ' in content_lower:
            return 'sql'
        elif '<html' in content_lower or '<!doctype' in content_lower:
            return 'html'
        elif content.strip().startswith('<') and content.strip().endswith('>'):
            return 'xml'
        
        return 'txt'

