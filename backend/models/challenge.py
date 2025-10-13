from datetime import datetime
from database import db

class ChallengeCategory(db.Model):
    __tablename__ = 'challenge_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))  
    color = db.Column(db.String(7))  
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    challenges = db.relationship('Challenge', backref='category', lazy='dynamic')
    
    def __repr__(self):
        return f'<ChallengeCategory {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'challenge_count': self.challenges.filter_by(is_published=True).count()
        }

class Challenge(db.Model):
    __tablename__ = 'challenges'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Challenge content
    scenario = db.Column(db.Text)  
    instructions = db.Column(db.Text, nullable=False)  
    questions = db.Column(db.JSON)  
    hints = db.Column(db.JSON)  
    
    # Challenge configuration
    challenge_type = db.Column(db.String(50), nullable=False)  
    difficulty = db.Column(db.String(20), nullable=False)  
    author = db.Column(db.String(100))  
    series = db.Column(db.String(200))  
    points = db.Column(db.Integer, default=100, nullable=False)
    time_limit = db.Column(db.Integer)  
    operating_system = db.Column(db.String(50))  
    
    # Files and resources
    file_attachments = db.Column(db.JSON)  
    suggested_tools = db.Column(db.JSON)  
    docker_image = db.Column(db.String(255))  
    environment_url = db.Column(db.String(255))  
    
    # Answers and validation
    answer_type = db.Column(db.String(20), nullable=False)  
    correct_answer = db.Column(db.Text)  
    answer_format = db.Column(db.String(100))  
    validation_regex = db.Column(db.String(500))  
    
    # Publishing and visibility
    is_published = db.Column(db.Boolean, default=False, nullable=False)
    is_featured = db.Column(db.Boolean, default=False, nullable=False)
    publish_date = db.Column(db.DateTime)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Stats
    total_attempts = db.Column(db.Integer, default=0, nullable=False)
    successful_attempts = db.Column(db.Integer, default=0, nullable=False)
    average_completion_time = db.Column(db.Float)  
    
    # Foreign keys
    category_id = db.Column(db.Integer, db.ForeignKey('challenge_categories.id'), nullable=False)
    
    # Relationships
    submissions = db.relationship('Submission', backref='challenge', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Challenge {self.title}>'
    
    def to_dict(self, include_sensitive=False):
        """Convert challenge to dictionary"""
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'scenario': self.scenario,
            'instructions': self.instructions,
            'questions': self.questions or [],
            'challenge_type': self.challenge_type,
            'difficulty': self.difficulty,
            'author': self.author,
            'series': self.series,
            'points': self.points,
            'time_limit': self.time_limit,
            'operating_system': self.operating_system,
            'file_attachments': self.file_attachments or [],
            'suggested_tools': self.suggested_tools or [],
            'environment_url': self.environment_url,
            'answer_type': self.answer_type,
            'answer_format': self.answer_format,
            'is_featured': self.is_featured,
            'publish_date': self.publish_date.isoformat() if self.publish_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'total_attempts': self.total_attempts,
            'successful_attempts': self.successful_attempts,
            'solves': self.submissions.filter_by(is_correct=True).count(),
            'success_rate': round((self.successful_attempts / max(self.total_attempts, 1)) * 100, 1),
            'category': self.category.to_dict() if self.category else None
        }
        
        if include_sensitive:
            data.update({
                'hints': self.hints or [],
                'correct_answer': self.correct_answer,
                'validation_regex': self.validation_regex,
                'docker_image': self.docker_image,
                'is_published': self.is_published,
                'created_by': self.created_by,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            })
        
        return data
    
    def calculate_success_rate(self):
        """Calculate and return success rate"""
        if self.total_attempts == 0:
            return 0
        return round((self.successful_attempts / self.total_attempts) * 100, 1)

class Submission(db.Model):
    __tablename__ = 'submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False)
    
    # Submission details
    submitted_answer = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    points_awarded = db.Column(db.Integer, default=0, nullable=False)
    
    # Timing
    started_at = db.Column(db.DateTime, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completion_time = db.Column(db.Float)  # Time taken in minutes
    
    # Feedback
    feedback = db.Column(db.Text)  
    hint_count = db.Column(db.Integer, default=0, nullable=False)  
    
    # File submissions (for challenges requiring file uploads)
    submitted_files = db.Column(db.JSON)  # Array of uploaded file paths
    
    def __repr__(self):
        return f'<Submission {self.id}: User {self.user_id} -> Challenge {self.challenge_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'challenge_title': self.challenge.title if self.challenge else None,
            'submitted_answer': self.submitted_answer,
            'is_correct': self.is_correct,
            'points_awarded': self.points_awarded,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'completion_time': self.completion_time,
            'feedback': self.feedback,
            'hint_count': self.hint_count
        }
