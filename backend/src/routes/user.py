from flask import Blueprint, jsonify, request, current_app, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import requests
from src.models.user import User, db

user_bp = Blueprint('user', __name__)

# Health check endpoint
@user_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'PasteBin Scraper API is running',
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

# User registration
@user_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'User already exists'}), 409
        
        # Create new user
        password_hash = generate_password_hash(password)
        user = User(email=email, password_hash=password_hash)
        db.session.add(user)
        db.session.commit()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'email': user.email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User login
@user_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'email': user.email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# GitHub OAuth login initiation
@user_bp.route('/auth/github', methods=['GET'])
def github_oauth():
    try:
        client_id = current_app.config.get('GITHUB_CLIENT_ID')
        redirect_uri = request.args.get('redirect_uri', 'https://ugumdvps.manus.space')
        
        # For demo purposes, we'll simulate OAuth flow
        # In production, this would redirect to GitHub OAuth
        github_auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope=user:email"
        
        return jsonify({
            'auth_url': github_auth_url,
            'message': 'GitHub OAuth not fully configured - demo mode',
            'demo_token': 'demo_github_token_12345'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# GitHub OAuth callback (demo implementation)
@user_bp.route('/auth/github/callback', methods=['POST'])
def github_callback():
    try:
        data = request.json
        code = data.get('code')
        
        if not code:
            return jsonify({'error': 'Authorization code required'}), 400
        
        # In a real implementation, you would:
        # 1. Exchange code for access token with GitHub
        # 2. Use access token to get user info from GitHub API
        # 3. Create or find user in database
        # 4. Generate JWT token
        
        # For demo purposes, create a demo user
        demo_email = f"github_user_{datetime.datetime.utcnow().timestamp()}@example.com"
        
        # Check if user exists or create new one
        user = User.query.filter_by(email=demo_email).first()
        if not user:
            user = User(email=demo_email, github_id=f"github_{code}")
            db.session.add(user)
            db.session.commit()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'email': user.email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'GitHub OAuth successful (demo mode)',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get current user info
@user_bp.route('/me', methods=['GET'])
def get_current_user():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        
        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Legacy routes for backward compatibility
@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': user.id,
        'email': user.email,
        'created_at': user.created_at.isoformat() if user.created_at else None
    } for user in users])

@user_bp.route('/users', methods=['POST'])
def create_user():
    data = request.json
    user = User(email=data.get('email', 'test@example.com'))
    db.session.add(user)
    db.session.commit()
    return jsonify({
        'id': user.id,
        'email': user.email,
        'created_at': user.created_at.isoformat() if user.created_at else None
    }), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({
        'id': user.id,
        'email': user.email,
        'created_at': user.created_at.isoformat() if user.created_at else None
    })

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.email = data.get('email', user.email)
    db.session.commit()
    return jsonify({
        'id': user.id,
        'email': user.email,
        'created_at': user.created_at.isoformat() if user.created_at else None
    })

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204

