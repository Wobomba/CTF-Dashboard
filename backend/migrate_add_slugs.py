#!/usr/bin/env python3
"""
Migration script to add slugs to existing challenges
Run this script to add slug field to all existing challenges
"""

import os
import sys
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import db
from models.challenge import Challenge

def migrate_challenges():
    """Add slugs to all existing challenges"""
    with app.app_context():
        print("Starting challenge slug migration...")
        
        try:
            # Check if slug column exists
            result = db.engine.execute("PRAGMA table_info(challenges)")
            columns = [row[1] for row in result]
            
            if 'slug' not in columns:
                print("❌ Slug column doesn't exist in challenges table!")
                print("Please run: python add_slug_column.py first")
                return False
            
            challenges = Challenge.query.all()
            updated_count = 0
            
            for challenge in challenges:
                if not challenge.slug:
                    # Generate unique slug
                    slug = Challenge.create_unique_slug(challenge.title)
                    challenge.slug = slug
                    challenge.updated_at = datetime.utcnow()
                    updated_count += 1
                    print(f"Added slug '{slug}' to challenge '{challenge.title}' (ID: {challenge.id})")
            
            if updated_count > 0:
                db.session.commit()
                print(f"Migration complete! Updated {updated_count} challenges with slugs.")
            else:
                print("No challenges needed slug updates.")
            
            # Verify all challenges have slugs
            challenges_without_slugs = Challenge.query.filter_by(slug=None).count()
            if challenges_without_slugs > 0:
                print(f"WARNING: {challenges_without_slugs} challenges still don't have slugs!")
            else:
                print("✅ All challenges now have slugs!")
                
            return True
            
        except Exception as e:
            print(f"❌ Error during migration: {e}")
            return False

if __name__ == '__main__':
    migrate_challenges()
