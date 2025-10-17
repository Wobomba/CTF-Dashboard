from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
import json
import re
import sys
import os

from database import db
from models.user import User
from models.challenge import Challenge, ChallengeCategory, Submission
from models.progress import UserProgress

challenges_bp = Blueprint('challenges', __name__)

@challenges_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all challenge categories"""
    try:
        categories = ChallengeCategory.query.all()
        return jsonify({
            'categories': [cat.to_dict() for cat in categories]
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch categories', 'details': str(e)}), 500

@challenges_bp.route('/', methods=['GET'])
def get_challenges():
    """Get all published challenges with optional filtering"""
    try:
        # Query parameters
        category_id = request.args.get('category_id', type=int)
        difficulty = request.args.get('difficulty')
        challenge_type = request.args.get('type')
        search = request.args.get('search', '').strip()
        featured_only = request.args.get('featured', 'false').lower() == 'true'
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100) 
        
        # Base query for published challenges
        query = Challenge.query.filter_by(is_published=True)
        
        # Apply filters
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if difficulty:
            query = query.filter_by(difficulty=difficulty)
        
        if challenge_type:
            query = query.filter_by(challenge_type=challenge_type)
        
        if featured_only:
            query = query.filter_by(is_featured=True)
        
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                Challenge.title.ilike(search_term) |
                Challenge.description.ilike(search_term)
            )
        
        # Order by featured first, then by creation date
        query = query.order_by(Challenge.is_featured.desc(), Challenge.created_at.desc())
        
        # Paginate
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        challenges = paginated.items
        
        return jsonify({
            'challenges': [challenge.to_dict() for challenge in challenges],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages,
                'has_next': paginated.has_next,
                'has_prev': paginated.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch challenges', 'details': str(e)}), 500

@challenges_bp.route('/<challenge_identifier>', methods=['GET'])
@jwt_required(optional=True)
def get_challenge(challenge_identifier):
    """Get a specific challenge with user progress if authenticated"""
    try:
        # Try to find by slug first, then by ID
        if challenge_identifier.isdigit():
            challenge = Challenge.query.filter_by(id=int(challenge_identifier), is_published=True).first()
        else:
            challenge = Challenge.query.filter_by(slug=challenge_identifier, is_published=True).first()
        
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        challenge_data = challenge.to_dict()
        
        # Add user-specific data if authenticated
        user_identity = get_jwt_identity()
        if user_identity:
            user_id = int(user_identity)
            progress = UserProgress.query.filter_by(
                user_id=user_id,
                challenge_id=challenge.id
            ).first()
            
            challenge_data['user_progress'] = progress.to_dict() if progress else None
            
            # Check if user has already completed this challenge
            completed_submission = Submission.query.filter_by(
                user_id=user_id,
                challenge_id=challenge.id,
                is_correct=True
            ).first()
            
            challenge_data['user_completed'] = completed_submission is not None
        
        return jsonify({'challenge': challenge_data}), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch challenge', 'details': str(e)}), 500

@challenges_bp.route('/<challenge_identifier>/start', methods=['POST'])
@jwt_required()
def start_challenge(challenge_identifier):
    """Start a challenge (track user progress)"""
    try:
        user_id = int(get_jwt_identity())
        
        # Try to find by slug first, then by ID
        if challenge_identifier.isdigit():
            challenge = Challenge.query.filter_by(id=int(challenge_identifier), is_published=True).first()
        else:
            challenge = Challenge.query.filter_by(slug=challenge_identifier, is_published=True).first()
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        # Get or create progress record
        progress = UserProgress.query.filter_by(
            user_id=user_id,
            challenge_id=challenge.id
        ).first()
        
        if not progress:
            progress = UserProgress(
                user_id=user_id,
                challenge_id=challenge.id,
                status='in_progress',
                started_at=datetime.utcnow(),
                last_accessed=datetime.utcnow()
            )
            db.session.add(progress)
        else:
            progress.start_challenge()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Challenge started successfully',
            'progress': progress.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to start challenge', 'details': str(e)}), 500

@challenges_bp.route('/<challenge_identifier>/submit', methods=['POST'])
@jwt_required()
def submit_answer(challenge_identifier):
    """Submit an answer for a challenge"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data.get('answer'):
            return jsonify({'error': 'Answer is required'}), 400
        
        # Try to find by slug first, then by ID
        if challenge_identifier.isdigit():
            challenge = Challenge.query.filter_by(id=int(challenge_identifier), is_published=True).first()
        else:
            challenge = Challenge.query.filter_by(slug=challenge_identifier, is_published=True).first()
        
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        # Get or create progress record
        progress = UserProgress.query.filter_by(
            user_id=user_id,
            challenge_id=challenge.id
        ).first()
        
        if not progress:
            progress = UserProgress(
                user_id=user_id,
                challenge_id=challenge.id,
                status='in_progress',
                started_at=datetime.utcnow(),
                attempts_count=0,
                hints_used=0,
                time_spent=0.0
            )
            db.session.add(progress)
        
        # Increment attempt count
        # Safety check for None values
        if progress.attempts_count is None:
            progress.attempts_count = 0
        progress.attempts_count += 1
        progress.last_accessed = datetime.utcnow()

        # Check if user already completed this challenge all questions correct
        existing_correct = Submission.query.filter_by(
            user_id=user_id,
            challenge_id=challenge.id,
            is_correct=True
        ).first()

        # For multi-question challenges, only block if ALL questions are completed
        if existing_correct:
            # Check if this is a complete challenge submission (all questions answered)
            try:
                submitted_answers = json.loads(existing_correct.submitted_answer) if isinstance(existing_correct.submitted_answer, str) else existing_correct.submitted_answer
                questions_data = challenge.questions
                if isinstance(questions_data, str):
                    questions_data = json.loads(questions_data)
                
                # Count how many questions should be answered
                total_questions = len(questions_data) if questions_data else 1
                answered_questions = len(submitted_answers) if isinstance(submitted_answers, dict) else 1
                
                # Only block if all questions are answered
                if answered_questions >= total_questions:
                    return jsonify({
                        'error': 'You have already completed this challenge',
                        'is_correct': True,
                        'previous_submission': existing_correct.to_dict()
                    }), 409
            except (json.JSONDecodeError, TypeError, KeyError):
                # If we can't parse, fall back to blocking (safer)
                pass
        
        # Validate answer
        submitted_answer = data['answer']
        question_key = data.get('question_key')
        
        try:
            print(f"DEBUG: Challenge ID: {challenge.id}")
            print(f"DEBUG: Challenge questions: {challenge.questions}")
            print(f"DEBUG: Submitted answer: {submitted_answer}")
            print(f"DEBUG: Question key: {question_key}")
            is_correct = validate_answer(challenge, submitted_answer, question_key)
            print(f"DEBUG: Validation result: {is_correct}")
        except Exception as validation_error:
            print(f"Validation error: {validation_error}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': 'Failed to validate answer', 'details': str(validation_error)}), 500
        
        # Calculate completion time
        completion_time = None
        if progress.started_at:
            time_diff = datetime.utcnow() - progress.started_at
            completion_time = time_diff.total_seconds() / 60  # Convert to minutes
        
        # Calculate points awarded
        points_awarded = 0
        if is_correct:
            points_awarded = challenge.points
            
            # Apply penalties for hints used
            if progress.hints_used > 0:
                penalty = min(progress.hints_used * 10, challenge.points * 0.3)  # Max 30% penalty
                points_awarded = max(int(points_awarded - penalty), challenge.points // 2)
            
            # Speed bonus
            if completion_time and challenge.time_limit and completion_time <= (challenge.time_limit * 0.5):
                points_awarded = int(points_awarded * 1.2)  # 20% bonus
        
        # Handle submission record update existing or create new
        if existing_correct and not is_correct:
            # If there's an existing correct submission but this answer is wrong, don't create a new submission
            submission = existing_correct
        elif existing_correct and is_correct:
            # Update existing submission to include the new correct answer
            try:
                existing_answers = json.loads(existing_correct.submitted_answer) if isinstance(existing_correct.submitted_answer, str) else existing_correct.submitted_answer
                new_answers = json.loads(submitted_answer) if isinstance(submitted_answer, str) else submitted_answer
                
                # Merge the answers
                if isinstance(existing_answers, dict) and isinstance(new_answers, dict):
                    existing_answers.update(new_answers)
                    existing_correct.submitted_answer = json.dumps(existing_answers)
                    existing_correct.submitted_at = datetime.utcnow()
                    existing_correct.points_awarded += points_awarded
                    submission = existing_correct
                    print(f"DEBUG: Updated existing submission with new answer: {existing_correct.submitted_answer}")
                else:
                    # Fallback create new submission
                    submission = Submission(
                        user_id=user_id,
                        challenge_id=challenge.id,
                        submitted_answer=submitted_answer,
                        is_correct=is_correct,
                        points_awarded=points_awarded,
                        started_at=progress.started_at or datetime.utcnow(),
                        submitted_at=datetime.utcnow(),
                        completion_time=completion_time,
                        hint_count=progress.hints_used
                    )
                    db.session.add(submission)
            except (json.JSONDecodeError, TypeError, KeyError) as e:
                print(f"DEBUG: Error updating existing submission: {e}")
                # Fallback: create new submission
                submission = Submission(
                    user_id=user_id,
                    challenge_id=challenge.id,
                    submitted_answer=submitted_answer,
                    is_correct=is_correct,
                    points_awarded=points_awarded,
                    started_at=progress.started_at or datetime.utcnow(),
                    submitted_at=datetime.utcnow(),
                    completion_time=completion_time,
                    hint_count=progress.hints_used
                )
                db.session.add(submission)
        else:
            # Create new submission record
            print(f"DEBUG: Creating submission with submitted_answer: {submitted_answer}")
            submission = Submission(
                user_id=user_id,
                challenge_id=challenge.id,
                submitted_answer=submitted_answer,
                is_correct=is_correct,
                points_awarded=points_awarded,
                started_at=progress.started_at or datetime.utcnow(),
                submitted_at=datetime.utcnow(),
                completion_time=completion_time,
                hint_count=progress.hints_used
            )
            print(f"DEBUG: Submission created successfully")
            db.session.add(submission)
        
        # Update challenge statistics
        challenge.total_attempts += 1
        
        # Check if challenge is fully completed (all questions answered correctly)
        challenge_fully_completed = False
        if is_correct:
            try:
                # Get all answers from the submission
                all_answers = json.loads(submission.submitted_answer) if isinstance(submission.submitted_answer, str) else submission.submitted_answer
                questions_data = challenge.questions
                if isinstance(questions_data, str):
                    questions_data = json.loads(questions_data)
                
                # Check if all questions are answered
                total_questions = len(questions_data) if questions_data else 1
                answered_questions = len(all_answers) if isinstance(all_answers, dict) else 1
                
                print(f"DEBUG: Challenge completion check - Total: {total_questions}, Answered: {answered_questions}")
                
                if answered_questions >= total_questions:
                    challenge_fully_completed = True
                    challenge.successful_attempts += 1
                    
                    # Update user progress only when fully completed
                    first_attempt = progress.attempts_count == 1
                    progress.complete_challenge(first_attempt=first_attempt, completion_time=completion_time)
                    
                    # Update user statistics
                    user = User.query.get(user_id)
                    user.update_stats()
                    
                    print("DEBUG: Challenge fully completed!")
                else:
                    print("DEBUG: Challenge partially completed, waiting for more answers")
            except (json.JSONDecodeError, TypeError, KeyError) as e:
                print(f"DEBUG: Error checking challenge completion: {e}")
                challenge.successful_attempts += 1
                first_attempt = progress.attempts_count == 1
                progress.complete_challenge(first_attempt=first_attempt, completion_time=completion_time)
                user = User.query.get(user_id)
                user.update_stats()
                challenge_fully_completed = True
        
        db.session.commit()
        
        response_data = {
            'is_correct': is_correct,
            'correct': is_correct,  # Add both for compatibility
            'points_awarded': points_awarded,
            'submission': submission.to_dict(),
            'total_score': User.query.get(user_id).total_score
        }
        
        if is_correct:
            if challenge_fully_completed:
                response_data['message'] = 'Congratulations! You have completed the entire challenge!'
                response_data['challenge_completed'] = True
            else:
                response_data['message'] = 'Correct answer! Continue with the remaining questions.'
                response_data['challenge_completed'] = False
        else:
            response_data['message'] = 'Incorrect answer. Try again!'
            response_data['challenge_completed'] = False
            # Optionally provide hints for incorrect answers
            if challenge.hints and len(challenge.hints) > progress.hints_used:
                response_data['hint_available'] = True
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit answer', 'details': str(e)}), 500

@challenges_bp.route('/<challenge_identifier>/hint', methods=['POST'])
@jwt_required()
def get_hint(challenge_identifier):
    """Get the next available hint for a challenge"""
    try:
        user_id = int(get_jwt_identity())
        
        # Try to find by slug first, then by ID
        if challenge_identifier.isdigit():
            challenge = Challenge.query.filter_by(id=int(challenge_identifier), is_published=True).first()
        else:
            challenge = Challenge.query.filter_by(slug=challenge_identifier, is_published=True).first()
        
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        if not challenge.hints:
            return jsonify({'error': 'No hints available for this challenge'}), 404
        
        # Get user progress
        progress = UserProgress.query.filter_by(
            user_id=user_id,
            challenge_id=challenge.id
        ).first()
        
        if not progress:
            return jsonify({'error': 'You must start the challenge first'}), 400
        
        # Check if user already completed the challenge
        completed = Submission.query.filter_by(
            user_id=user_id,
            challenge_id=challenge.id,
            is_correct=True
        ).first()
        
        if completed:
            return jsonify({'error': 'Challenge already completed'}), 400
        
        # Check if more hints are available
        if progress.hints_used >= len(challenge.hints):
            return jsonify({'error': 'No more hints available'}), 404
        
        # Get the next hint
        hint = challenge.hints[progress.hints_used]
        progress.use_hint()
        
        return jsonify({
            'hint': hint,
            'hint_number': progress.hints_used,
            'total_hints': len(challenge.hints),
            'remaining_hints': len(challenge.hints) - progress.hints_used
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to get hint', 'details': str(e)}), 500

@challenges_bp.route('/my-progress', methods=['GET'])
@jwt_required()
def get_my_progress():
    """Get current user's progress across all challenges"""
    try:
        user_id = int(get_jwt_identity())
        
        # Get user progress
        progress_records = UserProgress.query.filter_by(user_id=user_id).all()
        
        # Get user submissions
        submissions = Submission.query.filter_by(user_id=user_id).all()
        
        # Organize data
        progress_data = []
        for progress in progress_records:
            progress_dict = progress.to_dict()
            
            # Add challenge information
            challenge = Challenge.query.get(progress.challenge_id)
            if challenge:
                progress_dict['challenge'] = {
                    'id': challenge.id,
                    'title': challenge.title,
                    'difficulty': challenge.difficulty,
                    'points': challenge.points,
                    'category': challenge.category.to_dict() if challenge.category else None
                }
            
            # Add submission information
            user_submissions = [s.to_dict() for s in submissions if s.challenge_id == progress.challenge_id]
            progress_dict['submissions'] = user_submissions
            
            progress_data.append(progress_dict)
        
        # Get user statistics
        user = User.query.get(user_id)
        
        return jsonify({
            'progress': progress_data,
            'user_stats': {
                'total_score': user.total_score,
                'challenges_completed': user.challenges_completed,
                'rank_position': user.rank_position
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch progress', 'details': str(e)}), 500

def validate_answer(challenge, submitted_answer, question_key=None):
    """Validate submitted answer against challenge solution"""
    import json
    
    print(f"DEBUG validate_answer: challenge.questions type: {type(challenge.questions)}")
    print(f"DEBUG validate_answer: challenge.questions value: {challenge.questions}")
    
    # Handle new structured questions system
    questions_data = challenge.questions
    if isinstance(questions_data, str):
        try:
            questions_data = json.loads(questions_data)
            print(f"DEBUG validate_answer: Parsed questions_data: {questions_data}")
        except json.JSONDecodeError:
            print("DEBUG validate_answer: Failed to parse questions JSON")
            questions_data = None
    
    if questions_data and isinstance(questions_data, list):
        try:
            # Parse submitted answer JSON
            if isinstance(submitted_answer, str):
                submitted_answers = json.loads(submitted_answer)
            else:
                submitted_answers = submitted_answer
            
            # If validating a specific question
            if question_key and question_key in submitted_answers:
                # Find the question in the challenge
                question = None
                for q in questions_data:
                    if f"question_{q['id']}" == question_key:
                        question = q
                        break
                
                if question and 'correct_answer' in question:
                    submitted = submitted_answers[question_key].strip()
                    correct = question['correct_answer'].strip()
                    
                    # Handle different answer formats
                    answer_format = question.get('answer_format', 'text').lower()
                    
                    if answer_format == 'flag':
                        return correct.lower() == submitted.lower()
                    elif answer_format in ['text', 'string']:
                        return correct.lower() == submitted.lower()
                    elif answer_format == 'number':
                        try:
                            return float(correct) == float(submitted)
                        except ValueError:
                            return correct == submitted
                    else:
                        return correct.lower() == submitted.lower()
            
            # Validate all questions if no specific question key
            else:
                all_correct = True
                for q in questions_data:
                    question_key = f"question_{q['id']}"
                    if question_key in submitted_answers and 'correct_answer' in q:
                        submitted = submitted_answers[question_key].strip()
                        correct = q['correct_answer'].strip()
                        
                        answer_format = q.get('answer_format', 'text').lower()
                        
                        if answer_format == 'flag':
                            question_correct = correct.lower() == submitted.lower()
                        elif answer_format in ['text', 'string']:
                            question_correct = correct.lower() == submitted.lower()
                        elif answer_format == 'number':
                            try:
                                question_correct = float(correct) == float(submitted)
                            except ValueError:
                                question_correct = correct == submitted
                        else:
                            question_correct = correct.lower() == submitted.lower()
                        
                        if not question_correct:
                            all_correct = False
                            break
                    else:
                        all_correct = False
                        break
                
                return all_correct
                
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            print(f"DEBUG validate_answer: Exception in structured validation: {e}")
            pass
    
    print("DEBUG validate_answer: Falling back to legacy validation")
    # Fallback to legacy validation for backward compatibility
    if not challenge.correct_answer:
        print("DEBUG validate_answer: No correct_answer found, returning False")
        return False
    
    # Clean up both answers
    correct = challenge.correct_answer.strip()
    if isinstance(submitted_answer, str):
        submitted = submitted_answer.strip()
    else:
        submitted = str(submitted_answer).strip()
    
    # Handle different answer types
    if challenge.answer_type == 'flag':
        # For CTF-style flags, exact match (case-insensitive)
        return correct.lower() == submitted.lower()
    
    elif challenge.answer_type == 'text':
        # For text answers, flexible matching
        if challenge.validation_regex:
            # Use regex if provided
            import re
            pattern = re.compile(challenge.validation_regex, re.IGNORECASE)
            return bool(pattern.match(submitted))
        else:
            # Simple case-insensitive comparison
            return correct.lower() == submitted.lower()
    
    elif challenge.answer_type == 'multiple_choice':
        # For multiple choice, exact match
        return correct == submitted
    
    else:
        # Default: exact match
        return correct == submitted

@challenges_bp.route('/<challenge_identifier>/recent-solves', methods=['GET'])
def get_recent_solves(challenge_identifier):
    """Get recent successful solves for a challenge"""
    try:
        # Try to find by slug first, then by ID
        if challenge_identifier.isdigit():
            challenge = Challenge.query.filter_by(id=int(challenge_identifier), is_published=True).first()
        else:
            challenge = Challenge.query.filter_by(slug=challenge_identifier, is_published=True).first()
        
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        # Get the 10 most recent successful submissions for this challenge
        recent_submissions = db.session.query(Submission, User).join(
            User, Submission.user_id == User.id
        ).filter(
            Submission.challenge_id == challenge.id,
            Submission.is_correct == True
        ).order_by(
            Submission.submitted_at.desc()
        ).limit(10).all()
        
        recent_solves = []
        for submission, user in recent_submissions:
            # Calculate time ago
            if submission.submitted_at:
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc)
                time_diff = now - submission.submitted_at.replace(tzinfo=timezone.utc)
                
                if time_diff.days > 0:
                    time_ago = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
                elif time_diff.seconds > 3600:
                    hours = time_diff.seconds // 3600
                    time_ago = f"{hours} hour{'s' if hours > 1 else ''} ago"
                elif time_diff.seconds > 60:
                    minutes = time_diff.seconds // 60
                    time_ago = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
                else:
                    time_ago = "Just now"
            else:
                time_ago = "Unknown"
            
            recent_solves.append({
                'username': user.username,
                'user_id': user.id,
                'completed_at': submission.submitted_at.isoformat() if submission.submitted_at else None,
                'time_ago': time_ago,
                'points_earned': submission.points_awarded or 0
            })
        
        return jsonify({
            'recent_solves': recent_solves
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch recent solves', 'details': str(e)}), 500

@challenges_bp.route('/<challenge_identifier>/leaderboard', methods=['GET'])
def get_challenge_leaderboard(challenge_identifier):
    """Get leaderboard and completion timeline for a specific challenge"""
    try:
        # Try to find by slug first, then by ID
        if challenge_identifier.isdigit():
            challenge = Challenge.query.filter_by(id=int(challenge_identifier), is_published=True).first()
        else:
            challenge = Challenge.query.filter_by(slug=challenge_identifier, is_published=True).first()
        
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        # Get all successful submissions for this challenge, ordered by submission time
        submissions_query = db.session.query(
            Submission.user_id,
            User.username,
            User.avatar_url,
            Submission.points_awarded,
            Submission.completion_time,
            Submission.submitted_at,
            Submission.hint_count
        ).join(User, Submission.user_id == User.id).filter(
            Submission.challenge_id == challenge.id,
            Submission.is_correct == True
        ).order_by(Submission.submitted_at.asc())
        
        all_submissions = submissions_query.all()
        
        # Create progression data for the line graph (points progression per user)
        # Get challenge details to know max possible points
        max_points = challenge.points
        
        # Get total number of questions in the challenge
        total_questions = 0
        if challenge.questions:
            if isinstance(challenge.questions, list):
                total_questions = len(challenge.questions)
            elif isinstance(challenge.questions, str):
                try:
                    import json
                    questions_data = json.loads(challenge.questions)
                    if isinstance(questions_data, list):
                        total_questions = len(questions_data)
                except (json.JSONDecodeError, TypeError):
                    total_questions = 1  # Fallback for legacy challenges
            else:
                total_questions = 1  # Fallback for legacy challenges
        else:
            total_questions = 1  # Fallback for legacy challenges
        
        # Get all submissions (including partial ones) to show progression
        all_submissions_query = db.session.query(
            Submission.user_id,
            User.username,
            User.avatar_url,
            Submission.points_awarded,
            Submission.submitted_at,
            Submission.is_correct
        ).join(User, Submission.user_id == User.id).filter(
            Submission.challenge_id == challenge.id
        ).order_by(Submission.submitted_at.asc())
        
        # Group submissions by user to show their progression
        user_progressions = {}
        for result in all_submissions_query.all():
            user_id, username, avatar_url, points, submitted_at, is_correct = result
            
            if user_id not in user_progressions:
                user_progressions[user_id] = {
                    'username': username,
                    'avatar_url': avatar_url,
                    'submissions': []
                }
            
            user_progressions[user_id]['submissions'].append({
                'points': points,
                'submitted_at': submitted_at,
                'is_correct': is_correct
            })
        
        # Create timeline data showing cumulative points for each user
        timeline_data = []
        user_index = 0
        
        for user_id, user_data in user_progressions.items():
            user_index += 1
            cumulative_points = 0
            
            # Add starting point (0 points)
            timeline_data.append({
                'user_index': user_index,
                'username': user_data['username'],
                'user_id': user_id,
                'avatar_url': user_data['avatar_url'],
                'points': 0,
                'cumulative_points': 0,
                'submission_number': 0,
                'is_start': True
            })
            
            # Add each submission point
            for i, submission in enumerate(user_data['submissions'], 1):
                if submission['is_correct']:
                    cumulative_points += submission['points']
                
                timeline_data.append({
                    'user_index': user_index,
                    'username': user_data['username'],
                    'user_id': user_id,
                    'avatar_url': user_data['avatar_url'],
                    'points': submission['points'],
                    'cumulative_points': cumulative_points,
                    'submission_number': i,
                    'submitted_at': submission['submitted_at'].isoformat(),
                    'is_correct': submission['is_correct'],
                    'is_start': False
                })
        
        # Create leaderboard top performers by speed and points
        leaderboard_query = db.session.query(
            Submission.user_id,
            User.username,
            User.avatar_url,
            Submission.points_awarded,
            Submission.completion_time,
            Submission.submitted_at,
            Submission.hint_count
        ).join(User, Submission.user_id == User.id).filter(
            Submission.challenge_id == challenge.id,
            Submission.is_correct == True
        ).order_by(
            Submission.completion_time.asc().nulls_last(),  
            Submission.points_awarded.desc(),  
            Submission.submitted_at.asc()  
        ).limit(10)
        
        leaderboard_data = []
        for rank, result in enumerate(leaderboard_query.all(), 1):
            user_id, username, avatar_url, points, completion_time, submitted_at, hint_count = result
            
            # Format completion time
            time_display = "N/A"
            if completion_time:
                if completion_time < 60:
                    time_display = f"{int(completion_time)}m"
                else:
                    hours = int(completion_time // 60)
                    minutes = int(completion_time % 60)
                    time_display = f"{hours}h {minutes}m"
            
            leaderboard_data.append({
                'rank': rank,
                'user_id': user_id,
                'username': username,
                'avatar_url': avatar_url,
                'points_awarded': points,
                'completion_time': completion_time,
                'time_display': time_display,
                'submitted_at': submitted_at.isoformat(),
                'hint_count': hint_count
            })
        
        return jsonify({
            'leaderboard': leaderboard_data,
            'timeline': timeline_data,
            'total_completions': len(all_submissions),
            'max_points': max_points,
            'total_questions': total_questions,
            'total_users': len(user_progressions)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch challenge leaderboard', 'details': str(e)}), 500
