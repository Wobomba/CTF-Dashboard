from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.security import generate_password_hash
from datetime import datetime
import sys
import os

from database import db
from models.user import User
from models.challenge import Challenge, ChallengeCategory, Submission
# Security imports removed for simplified deployment

admin_bp = Blueprint('admin', __name__)

def require_admin():
    """Decorator to require admin privileges"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            user_id = int(get_jwt_identity())
            user = User.query.get(user_id)
            if not user or not user.is_admin:
                return jsonify({'error': 'Admin privileges required'}), 403
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

@admin_bp.route('/setup/check', methods=['GET'])
def check_admin_setup():
    """Check if admin account exists - Simplified endpoint"""
    try:
        admin_exists = User.query.filter_by(is_admin=True).first() is not None
        
        return jsonify({
            'admin_exists': admin_exists,
            'setup_required': not admin_exists
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to check admin setup'}), 500

@admin_bp.route('/setup', methods=['POST'])
def setup_admin():
    """Create the first admin account - Simplified endpoint"""
    try:
        # Check if any admin already exists
        if User.query.filter_by(is_admin=True).first():
            return jsonify({'error': 'Admin account already exists'}), 400
        
        data = request.get_json()
        
        # Basic validation only
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if email is already taken
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Check if username is already taken
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400
        
        # Create admin user
        admin_user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            first_name=data['first_name'],
            last_name=data['last_name'],
            bio=data.get('bio', ''),
            is_admin=True,
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        # Create access token for immediate login
        access_token = create_access_token(identity=admin_user.id)
        
        return jsonify({
            'message': 'Admin account created successfully',
            'user': admin_user.to_dict(include_sensitive=True),
            'access_token': access_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create admin account'}), 500

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@require_admin()
def admin_dashboard():
    """Get admin dashboard statistics"""
    try:
        # User statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        new_users_today = User.query.filter(
            User.created_at >= datetime.utcnow().date()
        ).count()
        
        # Challenge statistics
        total_challenges = Challenge.query.count()
        published_challenges = Challenge.query.filter_by(is_published=True).count()
        featured_challenges = Challenge.query.filter_by(is_featured=True).count()
        
        # Submission statistics
        total_submissions = Submission.query.count()
        successful_submissions = Submission.query.filter_by(is_correct=True).count()
        submissions_today = Submission.query.filter(
            Submission.submitted_at >= datetime.utcnow().date()
        ).count()
        
        # Category statistics
        categories = ChallengeCategory.query.all()
        category_stats = []
        for category in categories:
            category_stats.append({
                'category': category.to_dict(),
                'challenge_count': category.challenges.filter_by(is_published=True).count(),
                'total_attempts': sum(c.total_attempts for c in category.challenges),
                'success_rate': calculate_category_success_rate(category)
            })
        
        return jsonify({
            'users': {
                'total': total_users,
                'active': active_users,
                'new_today': new_users_today
            },
            'challenges': {
                'total': total_challenges,
                'published': published_challenges,
                'featured': featured_challenges
            },
            'submissions': {
                'total': total_submissions,
                'successful': successful_submissions,
                'today': submissions_today,
                'success_rate': round((successful_submissions / max(total_submissions, 1)) * 100, 1)
            },
            'categories': category_stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch dashboard data', 'details': str(e)}), 500

@admin_bp.route('/categories', methods=['POST'])
@jwt_required()
@require_admin()
def create_category():
    """Create a new challenge category"""
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Category name is required'}), 400
        
        # Check if category already exists
        existing = ChallengeCategory.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'error': 'Category already exists'}), 409
        
        category = ChallengeCategory(
            name=data['name'],
            description=data.get('description', ''),
            icon=data.get('icon', 'folder'),
            color=data.get('color', '#3B82F6')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create category', 'details': str(e)}), 500

@admin_bp.route('/challenges', methods=['POST'])
@jwt_required()
@require_admin()
def create_challenge():
    """Create a new challenge"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'instructions', 'challenge_type', 'difficulty', 'category_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate questions if provided
        questions = data.get('questions', [])
        if questions:
            for i, question in enumerate(questions):
                if not question.get('question'):
                    return jsonify({'error': f'Question {i+1} text is required'}), 400
                if not question.get('correct_answer'):
                    return jsonify({'error': f'Question {i+1} correct answer is required'}), 400
        
        # Validate category exists
        category = ChallengeCategory.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Invalid category'}), 400
        
        challenge = Challenge(
            title=data['title'],
            description=data['description'],
            scenario=data.get('scenario', ''),
            instructions=data['instructions'],
            hints=data.get('hints', []),
            questions=data.get('questions', []),
            challenge_type=data['challenge_type'],
            difficulty=data['difficulty'],
            points=data.get('points', 100),
            time_limit=data.get('time_limit'),
            file_attachments=data.get('file_attachments', []),
            docker_image=data.get('docker_image'),
            environment_url=data.get('environment_url'),
            author=data.get('author', 'System'),
            series=data.get('series'),
            operating_system=data.get('operating_system'),
            suggested_tools=data.get('suggested_tools', []),
            # Legacy fields - provide defaults for backward compatibility
            answer_type='structured',  # Use 'structured' to indicate new question system
            correct_answer='',  # Empty since we use questions array
            answer_format='',
            validation_regex='',
            is_published=data.get('is_published', False),
            is_featured=data.get('is_featured', False),
            category_id=data['category_id'],
            created_by=user_id
        )
        
        if challenge.is_published:
            challenge.publish_date = datetime.utcnow()
        
        db.session.add(challenge)
        db.session.commit()
        
        return jsonify({
            'message': 'Challenge created successfully',
            'challenge': challenge.to_dict(include_sensitive=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create challenge', 'details': str(e)}), 500

@admin_bp.route('/challenges/<int:challenge_id>', methods=['PUT'])
@jwt_required()
@require_admin()
def update_challenge(challenge_id):
    """Update an existing challenge"""
    try:
        challenge = Challenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        updatable_fields = [
            'title', 'description', 'scenario', 'instructions', 'hints',
            'challenge_type', 'difficulty', 'points', 'time_limit',
            'file_attachments', 'docker_image', 'environment_url',
            'answer_type', 'correct_answer', 'answer_format', 'validation_regex',
            'is_published', 'is_featured', 'category_id'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(challenge, field, data[field])
        
        # Set publish date if publishing for the first time
        if data.get('is_published') and not challenge.publish_date:
            challenge.publish_date = datetime.utcnow()
        
        challenge.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Challenge updated successfully',
            'challenge': challenge.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update challenge', 'details': str(e)}), 500

@admin_bp.route('/challenges/<int:challenge_id>', methods=['DELETE'])
@jwt_required()
@require_admin()
def delete_challenge(challenge_id):
    """Delete a challenge"""
    try:
        challenge = Challenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        # Check if challenge has submissions
        submissions_count = challenge.submissions.count()
        if submissions_count > 0:
            return jsonify({
                'error': f'Cannot delete challenge with {submissions_count} submissions. Consider unpublishing instead.'
            }), 400
        
        db.session.delete(challenge)
        db.session.commit()
        
        return jsonify({'message': 'Challenge deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete challenge', 'details': str(e)}), 500

@admin_bp.route('/challenges', methods=['GET'])
@jwt_required()
@require_admin()
def get_all_challenges():
    """Get all challenges (including unpublished) for admin"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        challenges = Challenge.query.order_by(Challenge.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'challenges': [challenge.to_dict(include_sensitive=True) for challenge in challenges.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': challenges.total,
                'pages': challenges.pages,
                'has_next': challenges.has_next,
                'has_prev': challenges.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch challenges', 'details': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_admin()
def get_all_users():
    """Get all users for admin"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        users = User.query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict(include_sensitive=True) for user in users.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': users.total,
                'pages': users.pages,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch users', 'details': str(e)}), 500

@admin_bp.route('/users', methods=['POST'])
@jwt_required()
@require_admin()
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password length
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            bio=data.get('bio'),
            is_admin=data.get('is_admin', False),
            is_active=True,
            is_verified=False
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': new_user.to_dict(include_sensitive=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/toggle-active', methods=['POST'])
@jwt_required()
@require_admin()
def toggle_user_active(user_id):
    """Toggle user active status"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent deactivating admin users
        current_user_id = int(get_jwt_identity())
        if user.is_admin and user.id != current_user_id:
            return jsonify({'error': 'Cannot deactivate other admin users'}), 403
        
        user.is_active = not user.is_active
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        status = 'activated' if user.is_active else 'deactivated'
        return jsonify({
            'message': f'User {status} successfully',
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to toggle user status', 'details': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/toggle-admin', methods=['POST'])
@jwt_required()
@require_admin()
def toggle_user_admin(user_id):
    """Toggle user admin status"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = int(get_jwt_identity())
        
        # Prevent self-demotion from admin
        if user.id == current_user_id and user.is_admin:
            return jsonify({'error': 'Cannot remove admin privileges from yourself'}), 403
        
        # Toggle admin status
        user.is_admin = not user.is_admin
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        action = 'promoted to admin' if user.is_admin else 'removed from admin'
        return jsonify({
            'message': f'User {action} successfully',
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to toggle admin status', 'details': str(e)}), 500

def calculate_category_success_rate(category):
    """Calculate overall success rate for a category"""
    total_attempts = 0
    successful_attempts = 0
    
    for challenge in category.challenges:
        total_attempts += challenge.total_attempts
        successful_attempts += challenge.successful_attempts
    
    if total_attempts == 0:
        return 0
    
    return round((successful_attempts / total_attempts) * 100, 1)
