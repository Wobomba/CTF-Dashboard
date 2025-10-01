from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import sys
import os

from database import db
from models.user import User
from models.challenge import Challenge, Submission
from models.progress import UserProgress

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get the global leaderboard"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        timeframe = request.args.get('timeframe', 'all')  # 'all', 'month', 'week'
        
        # Base query for active users with scores
        query = User.query.filter(User.is_active == True, User.total_score > 0)
        
        # Apply timeframe filtering
        if timeframe == 'month':
            one_month_ago = datetime.utcnow() - timedelta(days=30)
            # Get users who scored points in the last month
            recent_scorers = db.session.query(Submission.user_id).filter(
                Submission.is_correct == True,
                Submission.submitted_at >= one_month_ago
            ).distinct().subquery()
            query = query.filter(User.id.in_(recent_scorers))
        
        elif timeframe == 'week':
            one_week_ago = datetime.utcnow() - timedelta(days=7)
            recent_scorers = db.session.query(Submission.user_id).filter(
                Submission.is_correct == True,
                Submission.submitted_at >= one_week_ago
            ).distinct().subquery()
            query = query.filter(User.id.in_(recent_scorers))
        
        # Order by total score descending
        query = query.order_by(User.total_score.desc())
        
        # Paginate
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        users = paginated.items
        
        # Build leaderboard data
        leaderboard = []
        for idx, user in enumerate(users, start=(page - 1) * per_page + 1):
            user_data = user.to_dict()
            user_data['rank'] = idx
            
            # Add recent activity for timeframe filtering
            if timeframe != 'all':
                if timeframe == 'month':
                    cutoff = datetime.utcnow() - timedelta(days=30)
                else:  # week
                    cutoff = datetime.utcnow() - timedelta(days=7)
                
                recent_points = db.session.query(db.func.sum(Submission.points_awarded)).filter(
                    Submission.user_id == user.id,
                    Submission.is_correct == True,
                    Submission.submitted_at >= cutoff
                ).scalar() or 0
                
                user_data['recent_points'] = recent_points
            
            leaderboard.append(user_data)
        
        return jsonify({
            'leaderboard': leaderboard,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages,
                'has_next': paginated.has_next,
                'has_prev': paginated.has_prev
            },
            'timeframe': timeframe
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch leaderboard', 'details': str(e)}), 500

@progress_bp.route('/user-stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get detailed statistics for the current user"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Basic user stats
        user_stats = user.to_dict(include_sensitive=True)
        
        # Progress by category
        category_progress = db.session.query(
            Challenge.category_id,
            db.func.count(Submission.id).label('completed'),
            db.func.sum(Submission.points_awarded).label('points')
        ).join(
            Submission, Challenge.id == Submission.challenge_id
        ).filter(
            Submission.user_id == user_id,
            Submission.is_correct == True
        ).group_by(Challenge.category_id).all()
        
        # Progress by difficulty
        difficulty_progress = db.session.query(
            Challenge.difficulty,
            db.func.count(Submission.id).label('completed'),
            db.func.sum(Submission.points_awarded).label('points')
        ).join(
            Submission, Challenge.id == Submission.challenge_id
        ).filter(
            Submission.user_id == user_id,
            Submission.is_correct == True
        ).group_by(Challenge.difficulty).all()
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_submissions = Submission.query.filter(
            Submission.user_id == user_id,
            Submission.submitted_at >= thirty_days_ago
        ).order_by(Submission.submitted_at.desc()).limit(10).all()
        
        # Activity streak (consecutive days with submissions)
        streak = calculate_activity_streak(user_id)
        
        # Average completion time
        avg_completion_time = db.session.query(
            db.func.avg(Submission.completion_time)
        ).filter(
            Submission.user_id == user_id,
            Submission.is_correct == True,
            Submission.completion_time.isnot(None)
        ).scalar() or 0
        
        return jsonify({
            'user_stats': user_stats,
            'category_progress': [
                {
                    'category_id': cat_id,
                    'completed': completed,
                    'points': points or 0
                } for cat_id, completed, points in category_progress
            ],
            'difficulty_progress': [
                {
                    'difficulty': difficulty,
                    'completed': completed,
                    'points': points or 0
                } for difficulty, completed, points in difficulty_progress
            ],
            'recent_activity': [sub.to_dict() for sub in recent_submissions],
            'activity_streak': streak,
            'avg_completion_time': round(avg_completion_time, 2) if avg_completion_time else 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch user stats', 'details': str(e)}), 500

@progress_bp.route('/bookmarks', methods=['GET'])
@jwt_required()
def get_bookmarks():
    """Get user's bookmarked challenges"""
    try:
        user_id = int(get_jwt_identity())
        
        bookmarked_progress = UserProgress.query.filter_by(
            user_id=user_id,
            is_bookmarked=True
        ).join(Challenge).filter(Challenge.is_published == True).all()
        
        bookmarks = []
        for progress in bookmarked_progress:
            bookmark_data = progress.to_dict()
            bookmark_data['challenge'] = progress.challenge.to_dict() if hasattr(progress, 'challenge') else None
            bookmarks.append(bookmark_data)
        
        return jsonify({'bookmarks': bookmarks}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch bookmarks', 'details': str(e)}), 500

@progress_bp.route('/bookmarks/<int:challenge_id>', methods=['POST'])
@jwt_required()
def toggle_bookmark(challenge_id):
    """Toggle bookmark status for a challenge"""
    try:
        user_id = int(get_jwt_identity())
        
        # Verify challenge exists
        challenge = Challenge.query.filter_by(id=challenge_id, is_published=True).first()
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        # Get or create progress record
        progress = UserProgress.query.filter_by(
            user_id=user_id,
            challenge_id=challenge_id
        ).first()
        
        if not progress:
            progress = UserProgress(
                user_id=user_id,
                challenge_id=challenge_id,
                is_bookmarked=True
            )
            db.session.add(progress)
        else:
            progress.is_bookmarked = not progress.is_bookmarked
        
        progress.last_accessed = datetime.utcnow()
        db.session.commit()
        
        action = 'added to' if progress.is_bookmarked else 'removed from'
        return jsonify({
            'message': f'Challenge {action} bookmarks',
            'is_bookmarked': progress.is_bookmarked
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to toggle bookmark', 'details': str(e)}), 500

@progress_bp.route('/notes/<int:challenge_id>', methods=['PUT'])
@jwt_required()
def update_notes(challenge_id):
    """Update user notes for a challenge"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if 'notes' not in data:
            return jsonify({'error': 'Notes field is required'}), 400
        
        # Verify challenge exists
        challenge = Challenge.query.filter_by(id=challenge_id, is_published=True).first()
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        # Get or create progress record
        progress = UserProgress.query.filter_by(
            user_id=user_id,
            challenge_id=challenge_id
        ).first()
        
        if not progress:
            progress = UserProgress(
                user_id=user_id,
                challenge_id=challenge_id,
                notes=data['notes']
            )
            db.session.add(progress)
        else:
            progress.notes = data['notes']
        
        progress.last_accessed = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Notes updated successfully',
            'notes': progress.notes
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update notes', 'details': str(e)}), 500

def calculate_activity_streak(user_id):
    """Calculate consecutive days with challenge submissions"""
    try:
        # Get unique submission dates in descending order
        submission_dates = db.session.query(
            db.func.date(Submission.submitted_at).label('submission_date')
        ).filter(
            Submission.user_id == user_id
        ).distinct().order_by(
            db.func.date(Submission.submitted_at).desc()
        ).all()
        
        if not submission_dates:
            return 0
        
        streak = 0
        current_date = datetime.utcnow().date()
        
        for submission_date, in submission_dates:
            if submission_date == current_date or submission_date == current_date - timedelta(days=streak):
                streak += 1
                current_date = submission_date
            else:
                break
        
        return streak
        
    except Exception:
        return 0
