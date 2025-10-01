from datetime import datetime
from database import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Profile information
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(255))
    
    # User status and permissions
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime)
    
    # Stats
    total_score = db.Column(db.Integer, default=0, nullable=False)
    challenges_completed = db.Column(db.Integer, default=0, nullable=False)
    rank_position = db.Column(db.Integer)
    
    # Relationships
    submissions = db.relationship('Submission', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    progress = db.relationship('UserProgress', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self, include_sensitive=False):
        """Convert user object to dictionary"""
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email if include_sensitive else None,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'total_score': self.total_score,
            'challenges_completed': self.challenges_completed,
            'rank_position': self.rank_position
        }
        
        if include_sensitive:
            data.update({
                'is_admin': self.is_admin,
                'is_active': self.is_active,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            })
        
        return data
    
    def update_stats(self):
        """Update user statistics based on submissions"""
        completed_submissions = self.submissions.filter_by(is_correct=True).all()
        self.challenges_completed = len(completed_submissions)
        self.total_score = sum(submission.points_awarded for submission in completed_submissions if submission.points_awarded)
        db.session.commit()
    
    @staticmethod
    def update_all_rankings():
        """Update rank positions for all users"""
        users = User.query.filter(User.total_score > 0).order_by(User.total_score.desc()).all()
        for idx, user in enumerate(users, 1):
            user.rank_position = idx
        db.session.commit()
