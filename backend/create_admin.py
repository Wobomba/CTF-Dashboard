#!/usr/bin/env python3
"""
Create predefined admin account for simplified deployment
"""

from app import app
from database import db
from models.user import User
from werkzeug.security import generate_password_hash
from datetime import datetime

def create_predefined_admin():
    """Create the predefined admin account"""
    with app.app_context():
        # Check if admin already exists
        existing_admin = User.query.filter_by(is_admin=True).first()
        if existing_admin:
            print(f"Admin already exists: {existing_admin.username} ({existing_admin.email})")
            return existing_admin
        
        # Create admin user with predefined credentials
        admin_user = User(
            username='admin',
            email='cert@renu.ac.ug',
            password_hash=generate_password_hash('Georgina@13Eye'),
            first_name='RENU',
            last_name='CERT',
            bio='System Administrator',
            is_admin=True,
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        print("✅ Predefined admin account created successfully!")
        print(f"Username: {admin_user.username}")
        print(f"Email: {admin_user.email}")
        print(f"Password: Georgina@13Eye")
        print(f"Name: {admin_user.first_name} {admin_user.last_name}")
        
        return admin_user

if __name__ == '__main__':
    create_predefined_admin()
