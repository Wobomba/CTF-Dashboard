from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

from database import db
from models.user import User
from models.challenge import Challenge

files_bp = Blueprint('files', __name__)

# Allowed file extensions for challenge files
ALLOWED_EXTENSIONS = {
    'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg',
    'mp3', 'mp4', 'avi', 'mov', 'wav',
    'exe', 'dll', 'bin', 'iso', 'img',
    'log', 'csv', 'json', 'xml', 'html', 'css', 'js',
    'pcap', 'cap', 'pcapng', 'wireshark',
    'sql', 'db', 'sqlite', 'sqlite3'
}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_size_mb(file):
    """Get file size in MB"""
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)  # Reset to beginning
    return round(size / (1024 * 1024), 2)

@files_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """Upload a file for a challenge (admin only)"""
    try:
        # Check if user is admin
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin privileges required'}), 403
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Get file password if provided
        password = request.form.get('password', '')
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(current_app.root_path, 'uploads', 'challenges')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # Get file size
        file_size_mb = get_file_size_mb(file)
        
        # Return file information
        file_info = {
            'id': str(uuid.uuid4()),
            'name': original_filename,
            'filename': unique_filename,
            'size': f"{file_size_mb} MB",
            'size_bytes': int(file_size_mb * 1024 * 1024),
            'password': password,
            'uploaded_at': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'message': 'File uploaded successfully',
            'file': file_info
        }), 201
        
    except Exception as e:
        return jsonify({'error': 'Failed to upload file', 'details': str(e)}), 500

@files_bp.route('/download/<filename>', methods=['GET'])
@jwt_required()
def download_file(filename):
    """Download a challenge file (authenticated users only)"""
    try:
        # Check if user is authenticated
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Security: Only allow alphanumeric filenames with dots
        if not filename.replace('.', '').replace('-', '').replace('_', '').isalnum():
            return jsonify({'error': 'Invalid filename'}), 400
        
        # Get file path
        upload_dir = os.path.join(current_app.root_path, 'uploads', 'challenges')
        file_path = os.path.join(upload_dir, filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Get original filename from challenge data (if available)
        # For now, we'll use the stored filename
        original_filename = filename
        
        # Find the challenge that contains this file
        challenges = Challenge.query.all()
        for challenge in challenges:
            if challenge.file_attachments:
                for file_attachment in challenge.file_attachments:
                    if file_attachment.get('filename') == filename:
                        original_filename = file_attachment.get('name', filename)
                        break
        
        return send_from_directory(
            upload_dir, 
            filename, 
            as_attachment=True,
            download_name=original_filename
        )
        
    except Exception as e:
        return jsonify({'error': 'Failed to download file', 'details': str(e)}), 500

@files_bp.route('/list', methods=['GET'])
@jwt_required()
def list_files():
    """List all uploaded files (admin only)"""
    try:
        # Check if user is admin
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin privileges required'}), 403
        
        # Get all challenges with file attachments
        challenges = Challenge.query.all()
        files = []
        
        for challenge in challenges:
            if challenge.file_attachments:
                for file_attachment in challenge.file_attachments:
                    file_info = {
                        'id': file_attachment.get('id'),
                        'name': file_attachment.get('name'),
                        'filename': file_attachment.get('filename'),
                        'size': file_attachment.get('size'),
                        'challenge_id': challenge.id,
                        'challenge_title': challenge.title,
                        'uploaded_at': file_attachment.get('uploaded_at')
                    }
                    files.append(file_info)
        
        return jsonify({'files': files}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to list files', 'details': str(e)}), 500

@files_bp.route('/delete/<filename>', methods=['DELETE'])
@jwt_required()
def delete_file(filename):
    """Delete a file (admin only)"""
    try:
        # Check if user is admin
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin privileges required'}), 403
        
        # Security: Only allow alphanumeric filenames with dots
        if not filename.replace('.', '').replace('-', '').replace('_', '').isalnum():
            return jsonify({'error': 'Invalid filename'}), 400
        
        # Get file path
        upload_dir = os.path.join(current_app.root_path, 'uploads', 'challenges')
        file_path = os.path.join(upload_dir, filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Remove file from disk
        os.remove(file_path)
        
        # Remove file reference from challenges
        challenges = Challenge.query.all()
        for challenge in challenges:
            if challenge.file_attachments:
                updated_files = []
                for file_attachment in challenge.file_attachments:
                    if file_attachment.get('filename') != filename:
                        updated_files.append(file_attachment)
                
                if len(updated_files) != len(challenge.file_attachments):
                    challenge.file_attachments = updated_files
                    db.session.commit()
        
        return jsonify({'message': 'File deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to delete file', 'details': str(e)}), 500
