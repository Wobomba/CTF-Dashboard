from datetime import datetime
from database import db

class UserProgress(db.Model):
    __tablename__ = 'user_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False)
    
    # Progress tracking
    status = db.Column(db.String(20), nullable=False, default='not_started')  # 'not_started', 'in_progress', 'completed', 'abandoned'
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    last_accessed = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Progress details
    attempts_count = db.Column(db.Integer, default=0, nullable=False)
    hints_used = db.Column(db.Integer, default=0, nullable=False)
    time_spent = db.Column(db.Float, default=0.0, nullable=False)  # Total time spent in minutes
    
    # Bookmarking and notes
    is_bookmarked = db.Column(db.Boolean, default=False, nullable=False)
    notes = db.Column(db.Text)  # User's personal notes
    
    # Achievement tracking
    first_attempt_success = db.Column(db.Boolean, default=False, nullable=False)
    speed_bonus_earned = db.Column(db.Boolean, default=False, nullable=False)
    
    # Unique constraint to prevent duplicate progress entries
    __table_args__ = (db.UniqueConstraint('user_id', 'challenge_id', name='unique_user_challenge_progress'),)
    
    def __repr__(self):
        return f'<UserProgress User:{self.user_id} Challenge:{self.challenge_id} Status:{self.status}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'status': self.status,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else None,
            'attempts_count': self.attempts_count,
            'hints_used': self.hints_used,
            'time_spent': self.time_spent,
            'is_bookmarked': self.is_bookmarked,
            'notes': self.notes,
            'first_attempt_success': self.first_attempt_success,
            'speed_bonus_earned': self.speed_bonus_earned
        }
    
    def start_challenge(self):
        """Mark challenge as started"""
        if self.status == 'not_started':
            self.status = 'in_progress'
            self.started_at = datetime.utcnow()
            self.last_accessed = datetime.utcnow()
            db.session.commit()
    
    def complete_challenge(self, first_attempt=False, completion_time=None):
        """Mark challenge as completed"""
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
        self.last_accessed = datetime.utcnow()
        self.first_attempt_success = first_attempt and self.attempts_count == 1
        
        if completion_time:
            self.time_spent = completion_time
            # Award speed bonus if completed quickly (implementation depends on challenge)
            from models.challenge import Challenge
            challenge = Challenge.query.get(self.challenge_id)
            if challenge and challenge.time_limit and completion_time <= (challenge.time_limit * 0.5):
                self.speed_bonus_earned = True
        
        db.session.commit()
    
    def add_attempt(self):
        """Increment attempt count"""
        self.attempts_count += 1
        self.last_accessed = datetime.utcnow()
        db.session.commit()
    
    def use_hint(self):
        """Increment hints used count"""
        self.hints_used += 1
        self.last_accessed = datetime.utcnow()
        db.session.commit()
    
    def update_time_spent(self, additional_time):
        """Add time to total time spent"""
        self.time_spent += additional_time
        self.last_accessed = datetime.utcnow()
        db.session.commit()

class Achievement(db.Model):
    __tablename__ = 'achievements'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(50))  # Icon name for UI
    badge_color = db.Column(db.String(7))  # Hex color code
    
    # Achievement criteria
    achievement_type = db.Column(db.String(50), nullable=False)  # 'challenges_completed', 'points_earned', 'streak', 'category_master', etc.
    criteria_value = db.Column(db.Integer)  # Required value to unlock
    category_id = db.Column(db.Integer, db.ForeignKey('challenge_categories.id'))  # For category-specific achievements
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    def __repr__(self):
        return f'<Achievement {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'badge_color': self.badge_color,
            'achievement_type': self.achievement_type,
            'criteria_value': self.criteria_value
        }

class UserAchievement(db.Model):
    __tablename__ = 'user_achievements'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id'), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='achievements')
    achievement = db.relationship('Achievement', backref='earned_by')
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('user_id', 'achievement_id', name='unique_user_achievement'),)
    
    def __repr__(self):
        return f'<UserAchievement User:{self.user_id} Achievement:{self.achievement_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'achievement': self.achievement.to_dict() if self.achievement else None,
            'earned_at': self.earned_at.isoformat() if self.earned_at else None
        }
