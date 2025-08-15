import json
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from src.models.user import User, db
from src.models.scraper import SearchSession, SearchResult, SearchLog, UserStats
from src.scrapers.scraper_manager import ScraperManager

scraper_bp = Blueprint('scraper', __name__)
scraper_manager = ScraperManager()

# Mock authentication for demo purposes
def get_current_user():
    # In a real app, this would validate JWT tokens or session cookies
    """Retrieve the current user from the database or create a demo user."""
    return User.query.first() or create_demo_user()

def create_demo_user():
    """Create a demo user if none exists."""
    user = User.query.filter_by(email='test@example.com').first()
    if not user:
        user = User(username='demo_user', email='test@example.com')
        db.session.add(user)
        db.session.commit()
    return user

@scraper_bp.route('/auth/login', methods=['POST'])
def login():
    """Handles user login and returns a mock JWT token."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # Mock authentication - in real app, verify credentials
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(username=email.split('@')[0], email=email)
        db.session.add(user)
        db.session.commit()
    
    return jsonify({
        'success': True,
        'user': user.to_dict(),
        'token': 'mock_jwt_token'
    })

@scraper_bp.route('/auth/user', methods=['GET'])
def get_user():
    """Returns current user information as a JSON response."""
    user = get_current_user()
    return jsonify(user.to_dict())

@scraper_bp.route('/services', methods=['GET'])
def get_services():
    """Returns a list of available pastebin services."""
    services = scraper_manager.get_available_services()
    return jsonify(services)

@scraper_bp.route('/services/test', methods=['POST'])
def test_services():
    """Test connections to pastebin services."""
    results = scraper_manager.test_service_connections()
    return jsonify(results)

@scraper_bp.route('/sessions', methods=['GET'])
def get_sessions():
    """Retrieves user's search sessions based on query parameters.
    
    This function handles GET requests to the '/sessions' endpoint. It fetches the
    current user, parses query parameters for pagination and filtering, constructs
    a query to filter search sessions by status and name if provided, orders them
    by creation date in descending order, and returns the paginated results as a
    JSON response.
    
    Args:
        page (int): The page number of the results to retrieve, defaults to 1.
        per_page (int): The number of items per page, defaults to 20.
        status (str): The status of the search sessions to filter by, if provided.
        search (str): The keyword to search for within session names, if provided.
    
    Returns:
        dict: A JSON response containing the list of sessions, total count, total pages,
            and current page number.
    """
    user = get_current_user()
    
    # Parse query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    search = request.args.get('search')
    
    # Build query
    query = SearchSession.query.filter_by(user_id=user.id)
    
    if status and status != 'all':
        query = query.filter(SearchSession.status == status)
    
    if search:
        query = query.filter(SearchSession.name.contains(search))
    
    # Order by creation date (newest first)
    query = query.order_by(SearchSession.created_at.desc())
    
    # Paginate
    sessions = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'sessions': [session.to_dict() for session in sessions.items],
        'total': sessions.total,
        'pages': sessions.pages,
        'current_page': page
    })

@scraper_bp.route('/sessions', methods=['POST'])
def create_session():
    """Create a new search session."""
    user = get_current_user()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'search_terms', 'services']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create session
    session = SearchSession(
        user_id=user.id,
        name=data['name'],
        search_terms=json.dumps(data['search_terms']),
        file_types=json.dumps(data.get('file_types', [])),
        services=json.dumps(data['services']),
        settings=json.dumps(data.get('settings', {}))
    )
    
    db.session.add(session)
    db.session.commit()
    
    return jsonify(session.to_dict()), 201

@scraper_bp.route('/sessions/<int:session_id>', methods=['GET'])
def get_session(session_id):
    """Retrieve a specific search session by ID."""
    user = get_current_user()
    session = SearchSession.query.filter_by(id=session_id, user_id=user.id).first()
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    return jsonify(session.to_dict())

@scraper_bp.route('/sessions/<int:session_id>/start', methods=['POST'])
def start_session(session_id):
    """Start a search session."""
    user = get_current_user()
    session = SearchSession.query.filter_by(id=session_id, user_id=user.id).first()
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    if session.status == 'running':
        return jsonify({'error': 'Session already running'}), 400
    
    # Start the session
    success = scraper_manager.start_search_session(session_id)
    
    if success:
        return jsonify({'message': 'Session started successfully'})
    else:
        return jsonify({'error': 'Failed to start session'}), 500

@scraper_bp.route('/sessions/<int:session_id>/stop', methods=['POST'])
def stop_session(session_id):
    """Stop a running search session."""
    user = get_current_user()
    session = SearchSession.query.filter_by(id=session_id, user_id=user.id).first()
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    success = scraper_manager.stop_search_session(session_id)
    
    if success:
        return jsonify({'message': 'Session stopped successfully'})
    else:
        return jsonify({'error': 'Failed to stop session'}), 500

@scraper_bp.route('/sessions/<int:session_id>/results', methods=['GET'])
def get_session_results(session_id):
    """Retrieves search results for a specific session.
    
    This function handles GET requests to fetch search results associated with a
    given session ID. It checks if the session exists and belongs to the current
    user. The function supports filtering by service and file type through query
    parameters, orders the results by relevance, and paginates them based on
    request parameters.
    
    Args:
        session_id (int): The ID of the search session for which results are requested.
    
    Returns:
        A JSON response containing the search results, total number of results, total
            pages,
        and the current page number.
    """
    user = get_current_user()
    session = SearchSession.query.filter_by(id=session_id, user_id=user.id).first()
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Parse query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    service = request.args.get('service')
    file_type = request.args.get('file_type')
    
    # Build query
    query = SearchResult.query.filter_by(session_id=session_id)
    
    if service:
        query = query.filter(SearchResult.service == service)
    
    if file_type:
        query = query.filter(SearchResult.file_type == file_type)
    
    # Order by relevance score (highest first)
    query = query.order_by(SearchResult.relevance_score.desc())
    
    # Paginate
    results = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'results': [result.to_dict() for result in results.items],
        'total': results.total,
        'pages': results.pages,
        'current_page': page
    })

@scraper_bp.route('/sessions/<int:session_id>/logs', methods=['GET'])
def get_session_logs(session_id):
    """Retrieve logs for a specified search session."""
    user = get_current_user()
    session = SearchSession.query.filter_by(id=session_id, user_id=user.id).first()
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    limit = request.args.get('limit', 50, type=int)
    logs = scraper_manager.get_session_logs(session_id, limit)
    
    return jsonify(logs)

@scraper_bp.route('/sessions/<int:session_id>/delete', methods=['DELETE'])
def delete_session(session_id):
    """Delete a search session by ID."""
    user = get_current_user()
    session = SearchSession.query.filter_by(id=session_id, user_id=user.id).first()
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Stop session if running
    if session.status == 'running':
        scraper_manager.stop_search_session(session_id)
    
    # Delete session (cascade will delete results and logs)
    db.session.delete(session)
    db.session.commit()
    
    return jsonify({'message': 'Session deleted successfully'})

@scraper_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Retrieve and update dashboard statistics for the current user."""
    user = get_current_user()
    
    # Get or create user stats
    stats = UserStats.query.filter_by(user_id=user.id).first()
    if not stats:
        stats = UserStats(user_id=user.id)
        db.session.add(stats)
        db.session.commit()
    
    # Calculate current stats
    total_searches = SearchSession.query.filter_by(user_id=user.id).count()
    total_results = db.session.query(SearchResult)\
                             .join(SearchSession)\
                             .filter(SearchSession.user_id == user.id)\
                             .count()
    
    active_crawls = SearchSession.query.filter_by(
        user_id=user.id, status='running'
    ).count()
    
    # Calculate success rate
    completed_sessions = SearchSession.query.filter_by(
        user_id=user.id, status='completed'
    ).all()
    
    if completed_sessions:
        avg_success_rate = sum(s.success_rate for s in completed_sessions) / len(completed_sessions)
    else:
        avg_success_rate = 0.0
    
    # Update stats
    stats.total_searches = total_searches
    stats.total_results = total_results
    stats.active_crawls = active_crawls
    stats.success_rate = avg_success_rate
    stats.last_updated = datetime.utcnow()
    db.session.commit()
    
    return jsonify(stats.to_dict())

@scraper_bp.route('/dashboard/recent-sessions', methods=['GET'])
def get_recent_sessions():
    """Retrieve recent search sessions for the dashboard."""
    user = get_current_user()
    
    sessions = SearchSession.query.filter_by(user_id=user.id)\
                                 .order_by(SearchSession.created_at.desc())\
                                 .limit(5)\
                                 .all()
    
    return jsonify([session.to_dict() for session in sessions])

@scraper_bp.route('/export/session/<int:session_id>', methods=['GET'])
def export_session_results(session_id):
    """Exports session results based on specified format.
    
    This function retrieves a search session by its ID and the current user, then
    exports the session results in either JSON or CSV format. If the session is not
    found, it returns a 404 error. Currently, only JSON export is implemented; CSV
    export returns a 501 Not Implemented status. Unsupported formats result in a
    400 Bad Request.
    
    Args:
        session_id (int): The ID of the search session to export results for.
    """
    user = get_current_user()
    session = SearchSession.query.filter_by(id=session_id, user_id=user.id).first()
    
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    format_type = request.args.get('format', 'json')
    
    results = SearchResult.query.filter_by(session_id=session_id).all()
    
    if format_type == 'json':
        return jsonify({
            'session': session.to_dict(),
            'results': [result.to_dict() for result in results]
        })
    elif format_type == 'csv':
        # In a real app, generate CSV content
        return jsonify({'error': 'CSV export not implemented yet'}), 501
    else:
        return jsonify({'error': 'Unsupported format'}), 400

