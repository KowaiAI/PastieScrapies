from src.models.user import db
from datetime import datetime
import json

class SearchSession(db.Model):
    __tablename__ = 'search_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    search_terms = db.Column(db.Text, nullable=False)  # JSON array of terms
    file_types = db.Column(db.Text, nullable=True)     # JSON array of file types
    services = db.Column(db.Text, nullable=False)      # JSON array of service IDs
    status = db.Column(db.String(20), default='pending')  # pending, running, completed, error, paused
    results_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    duration = db.Column(db.Integer, default=0)  # in seconds
    success_rate = db.Column(db.Float, default=0.0)
    settings = db.Column(db.Text, nullable=True)  # JSON for advanced settings
    
    # Relationships
    results = db.relationship('SearchResult', backref='session', lazy=True, cascade='all, delete-orphan')
    logs = db.relationship('SearchLog', backref='session', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<SearchSession {self.name}>'
    
    def to_dict(self):
        """Converts the object's attributes to a dictionary.
        
        This method serializes the object's attributes into a dictionary format,
        handling JSON parsing for `search_terms`, `file_types`, `services`, and
        `settings`. It also formats date-time fields (`created_at`, `started_at`,
        `completed_at`) to ISO format if they are not None. The method ensures that
        empty string values for these JSON fields are converted to appropriate default
        values (e.g., lists or dictionaries).
        
        Args:
            self: The instance of the class with attributes to be serialized.
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'search_terms': json.loads(self.search_terms) if self.search_terms else [],
            'file_types': json.loads(self.file_types) if self.file_types else [],
            'services': json.loads(self.services) if self.services else [],
            'status': self.status,
            'results_count': self.results_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'duration': self.duration,
            'success_rate': self.success_rate,
            'settings': json.loads(self.settings) if self.settings else {}
        }

class SearchResult(db.Model):
    __tablename__ = 'search_results'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('search_sessions.id'), nullable=False)
    paste_id = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    title = db.Column(db.String(200), nullable=True)
    content_preview = db.Column(db.Text, nullable=True)
    full_content = db.Column(db.Text, nullable=True)
    file_type = db.Column(db.String(20), nullable=True)
    matched_terms = db.Column(db.Text, nullable=False)  # JSON array of matched terms
    service = db.Column(db.String(50), nullable=False)
    discovered_at = db.Column(db.DateTime, default=datetime.utcnow)
    relevance_score = db.Column(db.Float, default=0.0)
    file_size = db.Column(db.Integer, default=0)
    
    def __repr__(self):
        return f'<SearchResult {self.paste_id}>'
    
    def to_dict(self):
        """Converts object attributes to a dictionary."""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'paste_id': self.paste_id,
            'url': self.url,
            'title': self.title,
            'content_preview': self.content_preview,
            'file_type': self.file_type,
            'matched_terms': json.loads(self.matched_terms) if self.matched_terms else [],
            'service': self.service,
            'discovered_at': self.discovered_at.isoformat() if self.discovered_at else None,
            'relevance_score': self.relevance_score,
            'file_size': self.file_size
        }

class SearchLog(db.Model):
    __tablename__ = 'search_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('search_sessions.id'), nullable=False)
    level = db.Column(db.String(10), nullable=False)  # info, warn, error, success
    service = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<SearchLog {self.level}: {self.message[:50]}>'
    
    def to_dict(self):
        """Converts instance attributes to a dictionary."""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'level': self.level,
            'service': self.service,
            'message': self.message,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class PastebinService(db.Model):
    __tablename__ = 'pastebin_services'
    
    id = db.Column(db.String(50), primary_key=True)  # e.g., 'pastebin', 'gist'
    name = db.Column(db.String(100), nullable=False)
    base_url = db.Column(db.String(200), nullable=False)
    has_api = db.Column(db.Boolean, default=False)
    api_endpoint = db.Column(db.String(200), nullable=True)
    rate_limit = db.Column(db.Integer, default=60)  # requests per minute
    status = db.Column(db.String(20), default='active')  # active, warning, error
    last_checked = db.Column(db.DateTime, default=datetime.utcnow)
    success_rate = db.Column(db.Float, default=100.0)
    
    def __repr__(self):
        return f'<PastebinService {self.name}>'
    
    def to_dict(self):
        """Converts the object's attributes to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'base_url': self.base_url,
            'has_api': self.has_api,
            'api_endpoint': self.api_endpoint,
            'rate_limit': self.rate_limit,
            'status': self.status,
            'last_checked': self.last_checked.isoformat() if self.last_checked else None,
            'success_rate': self.success_rate
        }

class UserStats(db.Model):
    __tablename__ = 'user_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    total_searches = db.Column(db.Integer, default=0)
    total_results = db.Column(db.Integer, default=0)
    active_crawls = db.Column(db.Integer, default=0)
    success_rate = db.Column(db.Float, default=0.0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<UserStats user_id={self.user_id}>'
    
    def to_dict(self):
        """Converts object attributes to a dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'total_searches': self.total_searches,
            'total_results': self.total_results,
            'active_crawls': self.active_crawls,
            'success_rate': self.success_rate,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }

