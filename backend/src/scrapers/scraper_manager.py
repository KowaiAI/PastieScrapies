import json
import threading
import time
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

from .pastebin_scraper import PastebinScraper
from .gist_scraper import GistScraper
from src.models.scraper import SearchSession, SearchResult, SearchLog, PastebinService, db

class ScraperManager:
    """Manages multiple scrapers and coordinates search sessions"""
    
    def __init__(self):
        self.scrapers = {
            'pastebin': PastebinScraper(),
            'gist': GistScraper(),
        }
        
        # Mock scrapers for other services (would be implemented similarly)
        self.mock_services = [
            {'id': 'paste_ee', 'name': 'paste.ee', 'rate_limit': 20},
            {'id': 'dpaste', 'name': 'dpaste.org', 'rate_limit': 30},
            {'id': 'nekobin', 'name': 'nekobin.com', 'rate_limit': 15},
            {'id': 'rentry', 'name': 'rentry.co', 'rate_limit': 25},
            {'id': 'hastebin', 'name': 'hastebin.com', 'rate_limit': 10},
            {'id': 'gitlab', 'name': 'GitLab Snippets', 'rate_limit': 120},
            {'id': 'ubuntu_paste', 'name': 'paste.ubuntu.com', 'rate_limit': 20},
            {'id': 'justpaste', 'name': 'justpaste.it', 'rate_limit': 15},
            {'id': 'controlc', 'name': 'controlc.com', 'rate_limit': 25},
            {'id': 'ideone', 'name': 'ideone.com', 'rate_limit': 40}
        ]
        
        self.active_sessions = {}  # session_id -> thread
        self.session_callbacks = {}  # session_id -> callback functions
    
    def get_available_services(self) -> List[Dict[str, Any]]:
        """Get list of all available pastebin services"""
        services = []
        
        # Add real scrapers
        for scraper_id, scraper in self.scrapers.items():
            services.append({
                'id': scraper_id,
                'name': scraper.name,
                'status': 'active',
                'has_api': True,
                'rate_limit': scraper.rate_limit
            })
        
        # Add mock services
        for service in self.mock_services:
            services.append({
                'id': service['id'],
                'name': service['name'],
                'status': 'active',
                'has_api': False,
                'rate_limit': service['rate_limit']
            })
        
        return services
    
    def start_search_session(self, session_id: int, 
                           progress_callback: Optional[Callable] = None,
                           log_callback: Optional[Callable] = None) -> bool:
        """Start a search session in a background thread"""
        
        if session_id in self.active_sessions:
            return False  # Session already running
        
        # Store callbacks
        self.session_callbacks[session_id] = {
            'progress': progress_callback,
            'log': log_callback
        }
        
        # Start search in background thread
        thread = threading.Thread(
            target=self._run_search_session,
            args=(session_id,),
            daemon=True
        )
        thread.start()
        
        self.active_sessions[session_id] = thread
        return True
    
    def stop_search_session(self, session_id: int) -> bool:
        """Stop a running search session"""
        if session_id not in self.active_sessions:
            return False
        
        # Update session status
        session = SearchSession.query.get(session_id)
        if session:
            session.status = 'stopped'
            session.completed_at = datetime.utcnow()
            db.session.commit()
        
        # Remove from active sessions
        del self.active_sessions[session_id]
        if session_id in self.session_callbacks:
            del self.session_callbacks[session_id]
        
        return True
    
    def _run_search_session(self, session_id: int):
        """Run a search session (called in background thread)"""
        try:
            session = SearchSession.query.get(session_id)
            if not session:
                return
            
            # Update session status
            session.status = 'running'
            session.started_at = datetime.utcnow()
            db.session.commit()
            
            self._log_message(session_id, 'info', 'System', f'Starting search session: {session.name}')
            
            # Parse session parameters
            search_terms = json.loads(session.search_terms) if session.search_terms else []
            file_types = json.loads(session.file_types) if session.file_types else []
            services = json.loads(session.services) if session.services else []
            settings = json.loads(session.settings) if session.settings else {}
            
            max_results = settings.get('maxResults', 1000)
            results_per_service = max_results // len(services) if services else max_results
            
            all_results = []
            
            # Search each service
            for i, service_id in enumerate(services):
                if session_id not in self.active_sessions:
                    break  # Session was stopped
                
                self._log_message(session_id, 'info', service_id, f'Starting search on {service_id}')
                
                try:
                    if service_id in self.scrapers:
                        # Use real scraper
                        scraper = self.scrapers[service_id]
                        results = scraper.search(
                            search_terms=search_terms,
                            file_types=file_types,
                            max_results=results_per_service,
                            **settings
                        )
                    else:
                        # Mock results for other services
                        results = self._generate_mock_results(
                            service_id, search_terms, file_types, results_per_service
                        )
                    
                    # Save results to database
                    for result_data in results:
                        result = SearchResult(
                            session_id=session_id,
                            paste_id=result_data['paste_id'],
                            url=result_data['url'],
                            title=result_data.get('title'),
                            content_preview=result_data.get('content_preview'),
                            full_content=result_data.get('full_content'),
                            file_type=result_data.get('file_type'),
                            matched_terms=json.dumps(result_data.get('matched_terms', [])),
                            service=result_data['service'],
                            relevance_score=result_data.get('relevance_score', 0.0),
                            file_size=result_data.get('file_size', 0)
                        )
                        db.session.add(result)
                    
                    all_results.extend(results)
                    
                    self._log_message(
                        session_id, 'success', service_id, 
                        f'Found {len(results)} matches'
                    )
                    
                    # Update progress
                    progress = ((i + 1) / len(services)) * 100
                    self._update_progress(session_id, progress, len(all_results))
                    
                except Exception as e:
                    self._log_message(
                        session_id, 'error', service_id, 
                        f'Search failed: {str(e)}'
                    )
                
                # Small delay between services
                time.sleep(1)
            
            # Update final session status
            session.status = 'completed'
            session.completed_at = datetime.utcnow()
            session.results_count = len(all_results)
            
            if session.started_at:
                duration = (session.completed_at - session.started_at).total_seconds()
                session.duration = int(duration)
            
            # Calculate success rate (mock calculation)
            session.success_rate = min(95.0 + (len(all_results) / max_results) * 5, 100.0)
            
            db.session.commit()
            
            self._log_message(
                session_id, 'success', 'System', 
                f'Search completed: {len(all_results)} total results found'
            )
            
        except Exception as e:
            # Handle session error
            session = SearchSession.query.get(session_id)
            if session:
                session.status = 'error'
                session.completed_at = datetime.utcnow()
                db.session.commit()
            
            self._log_message(session_id, 'error', 'System', f'Session failed: {str(e)}')
        
        finally:
            # Clean up
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
            if session_id in self.session_callbacks:
                del self.session_callbacks[session_id]
    
    def _generate_mock_results(self, service_id: str, search_terms: List[str], 
                             file_types: List[str], max_results: int) -> List[Dict[str, Any]]:
        """Generate mock results for services without real scrapers"""
        results = []
        
        # Generate a random number of results (0-5 for demo)
        import random
        num_results = random.randint(0, min(5, max_results))
        
        for i in range(num_results):
            paste_id = f"mock_{service_id}_{int(time.time())}_{i}"
            
            # Create mock content with search terms
            mock_content = f"Mock content containing {random.choice(search_terms)} and other data..."
            
            result = {
                'paste_id': paste_id,
                'url': f"https://{service_id}.example.com/{paste_id}",
                'title': f"Mock paste {i+1}",
                'content_preview': mock_content,
                'full_content': mock_content,
                'file_type': random.choice(file_types) if file_types else 'txt',
                'matched_terms': [random.choice(search_terms)],
                'service': service_id,
                'relevance_score': random.uniform(70.0, 95.0),
                'file_size': len(mock_content)
            }
            
            results.append(result)
        
        return results
    
    def _log_message(self, session_id: int, level: str, service: str, message: str):
        """Add a log message to the session"""
        log = SearchLog(
            session_id=session_id,
            level=level,
            service=service,
            message=message
        )
        db.session.add(log)
        db.session.commit()
        
        # Call log callback if available
        callbacks = self.session_callbacks.get(session_id, {})
        if callbacks.get('log'):
            callbacks['log'](log.to_dict())
    
    def _update_progress(self, session_id: int, progress: float, results_count: int):
        """Update session progress"""
        callbacks = self.session_callbacks.get(session_id, {})
        if callbacks.get('progress'):
            callbacks['progress']({
                'progress': progress,
                'results_count': results_count
            })
    
    def get_session_logs(self, session_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent logs for a session"""
        logs = SearchLog.query.filter_by(session_id=session_id)\
                             .order_by(SearchLog.timestamp.desc())\
                             .limit(limit)\
                             .all()
        
        return [log.to_dict() for log in reversed(logs)]
    
    def test_service_connections(self) -> Dict[str, bool]:
        """Test connections to all services"""
        results = {}
        
        for service_id, scraper in self.scrapers.items():
            results[service_id] = scraper.test_connection()
        
        # Mock results for other services
        for service in self.mock_services:
            results[service['id']] = True  # Assume they work for demo
        
        return results

