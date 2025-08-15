import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS

# Import all models first
from src.models.user import db, User
from src.models.scraper import SearchSession, SearchResult, SearchLog, PastebinService, UserStats

# Import routes
from src.routes.user import user_bp
from src.routes.scraper import scraper_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# GitHub OAuth Configuration
app.config['GITHUB_CLIENT_ID'] = os.environ.get('GITHUB_CLIENT_ID', 'demo_client_id')
app.config['GITHUB_CLIENT_SECRET'] = os.environ.get('GITHUB_CLIENT_SECRET', 'demo_client_secret')

# Enable CORS for all routes
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000', 'https://sfrpskwd.manus.space', 'https://uueswvou.manus.space', 'https://ugumdvps.manus.space', 'https://yuayfmid.manus.space', 'https://avrtlree.manus.space', 'https://ckofpiuv.manus.space', 'https://usvucvfi.manus.space', 'https://zosrwisl.manus.space', 'https://ehnbaygb.manus.space'])

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(scraper_bp, url_prefix='/api')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Initialize database
with app.app_context():
    db.create_all()
    
    # Initialize pastebin services if not exists
    try:
        from src.scrapers.scraper_manager import ScraperManager
        scraper_manager = ScraperManager()
        
        for service_data in scraper_manager.get_available_services():
            existing_service = db.session.get(PastebinService, service_data['id'])
            if not existing_service:
                service = PastebinService(
                    id=service_data['id'],
                    name=service_data['name'],
                    base_url=f"https://{service_data['id']}.com",  # Mock URL
                    has_api=service_data.get('has_api', False),
                    rate_limit=service_data['rate_limit'],
                    status=service_data['status']
                )
                db.session.add(service)
        
        db.session.commit()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization warning: {e}")
        db.session.rollback()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serves static files from the configured static folder.
    
    This function handles requests to serve static files located in the
    application's static folder. It first checks if a specific file exists at the
    requested path. If not, it attempts to serve 'index.html'. If neither the
    requested file nor 'index.html' exist, it returns a 404 error.
    
    Args:
        path (str): The path of the requested static file relative to the static folder.
    """
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
