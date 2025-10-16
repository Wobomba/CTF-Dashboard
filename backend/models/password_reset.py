from datetime import datetime, timedelta
import secrets
from database import db

class PasswordReset(db.Model):
    __tablename__ = 'password_resets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    user = db.relationship('User', backref='password_resets')
    
    def __init__(self, user_id, expires_in_hours=24):
        self.user_id = user_id
        self.token = self.generate_token()
        self.expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
    
    @staticmethod
    def generate_token():
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)
    
    def is_valid(self):
        """Check if the reset token is valid and not expired"""
        return not self.used and datetime.utcnow() < self.expires_at
    
    def mark_as_used(self):
        """Mark the token as used"""
        self.used = True
        db.session.commit()
    
    @classmethod
    def create_reset_token(cls, user_id, expires_in_hours=24):
        """Create a new password reset token for a user"""
        # Invalidate any existing tokens for this user
        cls.query.filter_by(user_id=user_id, used=False).update({'used': True})
        
        # Create new token
        reset_token = cls(user_id=user_id, expires_in_hours=expires_in_hours)
        db.session.add(reset_token)
        db.session.commit()
        
        return reset_token
    
    @classmethod
    def find_valid_token(cls, token):
        """Find a valid reset token"""
        reset_token = cls.query.filter_by(token=token).first()
        if reset_token and reset_token.is_valid():
            return reset_token
        return None
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'token': self.token,
            'expires_at': self.expires_at.isoformat(),
            'used': self.used,
            'created_at': self.created_at.isoformat()
        }
