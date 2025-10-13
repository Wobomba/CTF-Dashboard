#!/usr/bin/env python3
"""
Script to clear all user data from the database for a fresh installation.
This will remove all users, submissions, progress, and achievements while preserving
system data like categories and challenges.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import db
from models.user import User
from models.challenge import Submission
from models.progress import UserProgress, UserAchievement

def clear_user_data():
    """Clear all user-related data from the database"""
    
    with app.app_context():
        try:
            print("🗑️  Starting database cleanup...")
            
            # Get counts before deletion
            user_count = User.query.count()
            submission_count = Submission.query.count()
            progress_count = UserProgress.query.count()
            achievement_count = UserAchievement.query.count()
            
            print(f"📊 Current data counts:")
            print(f"   Users: {user_count}")
            print(f"   Submissions: {submission_count}")
            print(f"   Progress records: {progress_count}")
            print(f"   User achievements: {achievement_count}")
            
            if user_count == 0:
                print("✅ No user data found. Database is already clean.")
                return
            
            # Confirm deletion
            print(f"\n⚠️  WARNING: This will delete ALL user data!")
            print(f"   - {user_count} users")
            print(f"   - {submission_count} submissions")
            print(f"   - {progress_count} progress records")
            print(f"   - {achievement_count} user achievements")
            
            confirm = input("\n❓ Are you sure you want to proceed? Type 'YES' to confirm: ")
            
            if confirm != 'YES':
                print("❌ Operation cancelled.")
                return
            
            print("\n🧹 Clearing user data...")
            
            # Delete in order to respect foreign key constraints
            # 1. Delete user achievements first
            if achievement_count > 0:
                print("   🗑️  Deleting user achievements...")
                UserAchievement.query.delete()
                db.session.commit()
                print(f"   ✅ Deleted {achievement_count} user achievements")
            
            # 2. Delete user progress
            if progress_count > 0:
                print("   🗑️  Deleting user progress...")
                UserProgress.query.delete()
                db.session.commit()
                print(f"   ✅ Deleted {progress_count} progress records")
            
            # 3. Delete submissions
            if submission_count > 0:
                print("   🗑️  Deleting submissions...")
                Submission.query.delete()
                db.session.commit()
                print(f"   ✅ Deleted {submission_count} submissions")
            
            # 4. Delete users (this will cascade delete related data)
            if user_count > 0:
                print("   🗑️  Deleting users...")
                User.query.delete()
                db.session.commit()
                print(f"   ✅ Deleted {user_count} users")
            
            # Verify cleanup
            remaining_users = User.query.count()
            remaining_submissions = Submission.query.count()
            remaining_progress = UserProgress.query.count()
            remaining_achievements = UserAchievement.query.count()
            
            print(f"\n📊 Final counts:")
            print(f"   Users: {remaining_users}")
            print(f"   Submissions: {remaining_submissions}")
            print(f"   Progress records: {remaining_progress}")
            print(f"   User achievements: {remaining_achievements}")
            
            if remaining_users == 0 and remaining_submissions == 0:
                print("\n✅ Database cleanup completed successfully!")
                print("🎉 The application is now ready for a fresh installation.")
                print("🔧 You can now access /admin/setup to create the first admin account.")
            else:
                print("\n⚠️  Warning: Some data may not have been deleted.")
                
        except Exception as e:
            print(f"\n❌ Error during cleanup: {str(e)}")
            db.session.rollback()
            raise

def show_system_data():
    """Show what system data will be preserved"""
    
    with app.app_context():
        try:
            from models.challenge import ChallengeCategory, Challenge
            from models.progress import Achievement
            
            category_count = ChallengeCategory.query.count()
            challenge_count = Challenge.query.count()
            achievement_count = Achievement.query.count()
            
            print("📋 System data that will be preserved:")
            print(f"   Challenge Categories: {category_count}")
            print(f"   Challenges: {challenge_count}")
            print(f"   System Achievements: {achievement_count}")
            print("\n✅ These will remain intact for the fresh installation.")
            
        except Exception as e:
            print(f"⚠️  Could not check system data: {str(e)}")

if __name__ == "__main__":
    print("🧹 RENU-CERT CyberLab - Database Cleanup Tool")
    print("=" * 50)
    
    # Show what will be preserved
    show_system_data()
    print()
    
    # Perform cleanup
    clear_user_data()
    
    print("\n" + "=" * 50)
    print("🏁 Cleanup process completed.")
