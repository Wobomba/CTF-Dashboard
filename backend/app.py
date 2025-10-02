from flask import Flask, jsonify, request, send_from_directory
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///cyberlab.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize database
from database import db
db.init_app(app)

# Initialize other extensions
jwt = JWTManager(app)
migrate = Migrate(app, db)
CORS(app, origins=[os.getenv('FRONTEND_URL', 'http://localhost:3000')])

# Import models
from models.user import User
from models.challenge import Challenge, ChallengeCategory, Submission
from models.progress import UserProgress

# Import routes
from routes.auth import auth_bp
from routes.challenges import challenges_bp
from routes.admin import admin_bp
from routes.progress import progress_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(challenges_bp, url_prefix='/api/challenges')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(progress_bp, url_prefix='/api/progress')

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api')
def api_info():
    return jsonify({
        'name': 'RENU-CERT CyberLab API',
        'version': '1.0.0',
        'description': 'Cybersecurity training platform API'
    })

# Serve static files (frontend)
@app.route('/')
def serve_frontend():
    return send_from_directory('../dist', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Check if it's an API route
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Try to serve static file
    try:
        return send_from_directory('../dist', path)
    except:
        # If file not found, serve index.html for SPA routing
        return send_from_directory('../dist', 'index.html')

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is required'}), 401

@jwt.needs_fresh_token_loader
def token_not_fresh_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Fresh token required'}), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has been revoked'}), 401

# Create tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
