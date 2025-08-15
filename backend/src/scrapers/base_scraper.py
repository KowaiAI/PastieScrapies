import time
import requests
import re
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse
import logging

class BaseScraper(ABC):
    """Base class for all pastebin scrapers"""
    
    def __init__(self, service_id: str, name: str, base_url: str, rate_limit: int = 60):
        self.service_id = service_id
        self.name = name
        self.base_url = base_url
        self.rate_limit = rate_limit  # requests per minute
        self.last_request_time = 0
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.logger = logging.getLogger(f'scraper.{service_id}')
    
    def _rate_limit(self):
        """Enforce rate limiting between requests"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        min_interval = 60.0 / self.rate_limit  # seconds between requests
        
        if time_since_last < min_interval:
            sleep_time = min_interval - time_since_last
            self.logger.info(f"Rate limiting: sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def _make_request(self, url: str, **kwargs) -> Optional[requests.Response]:
        """Make a rate-limited HTTP request"""
        self._rate_limit()
        
        try:
            response = self.session.get(url, timeout=30, **kwargs)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            self.logger.error(f"Request failed for {url}: {e}")
            return None
    
    def _extract_text_content(self, html: str) -> str:
        """Extract text content from HTML, removing tags"""
        # Simple HTML tag removal - in production, use BeautifulSoup
        text = re.sub(r'<[^>]+>', '', html)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def _calculate_relevance_score(self, content: str, search_terms: List[str]) -> float:
        """Calculate relevance score based on term frequency and positioning"""
        if not content or not search_terms:
            return 0.0
        
        content_lower = content.lower()
        total_score = 0.0
        
        for term in search_terms:
            term_lower = term.lower()
            count = content_lower.count(term_lower)
            if count > 0:
                # Base score for presence
                score = min(count * 10, 50)  # Cap at 50 points per term
                
                # Bonus for early appearance
                first_pos = content_lower.find(term_lower)
                if first_pos != -1:
                    position_bonus = max(0, 20 - (first_pos / len(content) * 20))
                    score += position_bonus
                
                total_score += score
        
        # Normalize to 0-100 scale
        return min(total_score, 100.0)
    
    def _matches_file_type(self, content: str, url: str, file_types: List[str]) -> bool:
        """Check if content matches any of the specified file types"""
        if not file_types:
            return True  # No filter means accept all
        
        # Check URL extension
        parsed_url = urlparse(url)
        path = parsed_url.path.lower()
        for file_type in file_types:
            if path.endswith(f'.{file_type}'):
                return True
        
        # Check content patterns for common file types
        content_lower = content.lower()
        
        for file_type in file_types:
            if file_type == 'json' and ('{' in content and '}' in content):
                return True
            elif file_type == 'xml' and ('<' in content and '>' in content):
                return True
            elif file_type == 'py' and ('def ' in content or 'import ' in content):
                return True
            elif file_type == 'js' and ('function' in content or 'var ' in content or 'const ' in content):
                return True
            elif file_type == 'sql' and ('select ' in content_lower or 'insert ' in content_lower):
                return True
            elif file_type == 'php' and '<?php' in content_lower:
                return True
        
        return False
    
    def _contains_search_terms(self, content: str, search_terms: List[str], regex_mode: bool = False) -> List[str]:
        """Check if content contains any search terms and return matched terms"""
        if not content or not search_terms:
            return []
        
        matched_terms = []
        content_lower = content.lower()
        
        for term in search_terms:
            if regex_mode:
                try:
                    if re.search(term, content, re.IGNORECASE):
                        matched_terms.append(term)
                except re.error:
                    # Fall back to simple string search if regex is invalid
                    if term.lower() in content_lower:
                        matched_terms.append(term)
            else:
                if term.lower() in content_lower:
                    matched_terms.append(term)
        
        return matched_terms
    
    @abstractmethod
    def search(self, search_terms: List[str], file_types: List[str] = None, 
               max_results: int = 100, **kwargs) -> List[Dict[str, Any]]:
        """
        Search for pastes containing the specified terms
        
        Args:
            search_terms: List of terms to search for
            file_types: List of file types to filter by (optional)
            max_results: Maximum number of results to return
            **kwargs: Additional search parameters
        
        Returns:
            List of dictionaries containing paste information
        """
        pass
    
    @abstractmethod
    def get_paste_content(self, paste_id: str) -> Optional[str]:
        """
        Get the full content of a specific paste
        
        Args:
            paste_id: The ID of the paste to retrieve
        
        Returns:
            The full content of the paste, or None if not found
        """
        pass
    
    def test_connection(self) -> bool:
        """Test if the service is accessible"""
        try:
            response = self._make_request(self.base_url)
            return response is not None and response.status_code == 200
        except Exception as e:
            self.logger.error(f"Connection test failed: {e}")
            return False

