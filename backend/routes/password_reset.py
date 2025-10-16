from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
from datetime import datetime
import re
from database import db
from models.user import User
from models.password_reset import PasswordReset
from utils.email_service import send_password_reset_email

password_reset_bp = Blueprint('password_reset', __name__)

@password_reset_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email'):
            return jsonify({'error': 'Email is required'}), 400
        
        email = data['email'].strip().lower()
        
        # Validate email format
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        # Always return success to prevent email enumeration
        if not user:
            return jsonify({
                'message': 'If an account with that email exists, a password reset link has been sent.'
            }), 200
        
        # Create password reset token
        reset_token = PasswordReset.create_reset_token(user.id)
        
        # Send email (in production, this would send an actual email)
        try:
            send_password_reset_email(user.email, user.username, reset_token.token)
            current_app.logger.info(f"Password reset email sent to {user.email}")
        except Exception as e:
            current_app.logger.error(f"Failed to send password reset email: {e}")
            # Don't fail the request if email sending fails
        
        return jsonify({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in forgot password: {e}")
        return jsonify({'error': 'An error occurred while processing your request'}), 500

@password_reset_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        token = data.get('token')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        # Validate required fields
        if not token:
            return jsonify({'error': 'Reset token is required'}), 400
        
        if not new_password:
            return jsonify({'error': 'New password is required'}), 400
        
        if not confirm_password:
            return jsonify({'error': 'Password confirmation is required'}), 400
        
        if new_password != confirm_password:
            return jsonify({'error': 'Passwords do not match'}), 400
        
        # Validate password strength
        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Find valid reset token
        reset_token = PasswordReset.find_valid_token(token)
        if not reset_token:
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Get user
        user = User.query.get(reset_token.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update password
        user.password_hash = generate_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        
        # Mark token as used
        reset_token.mark_as_used()
        
        # Commit changes
        db.session.commit()
        
        current_app.logger.info(f"Password reset successful for user {user.email}")
        
        return jsonify({
            'message': 'Password has been reset successfully. You can now log in with your new password.'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error in reset password: {e}")
        return jsonify({'error': 'An error occurred while resetting your password'}), 500

@password_reset_bp.route('/validate-reset-token/<token>', methods=['GET'])
def validate_reset_token(token):
    """Validate a password reset token"""
    try:
        reset_token = PasswordReset.find_valid_token(token)
        
        if not reset_token:
            return jsonify({
                'valid': False,
                'message': 'Invalid or expired reset token'
            }), 400
        
        return jsonify({
            'valid': True,
            'message': 'Reset token is valid',
            'user': {
                'id': reset_token.user.id,
                'username': reset_token.user.username,
                'email': reset_token.user.email
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error validating reset token: {e}")
        return jsonify({'error': 'An error occurred while validating the token'}), 500
