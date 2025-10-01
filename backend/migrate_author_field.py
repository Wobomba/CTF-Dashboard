#!/usr/bin/env python3
"""
Migration script to add author field to existing challenges
Run this if you have existing challenges without the author field
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import db
from models.challenge import Challenge

def migrate_author_field():
    """Add author field to existing challenges"""
    with app.app_context():
        try:
            # Check if the author column exists
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('challenges')]
            
            if 'author' not in columns:
                print("Adding author column to challenges table...")
                with db.engine.connect() as conn:
                    conn.execute(db.text('ALTER TABLE challenges ADD COLUMN author VARCHAR(100)'))
                    conn.commit()
                print("✅ Author column added successfully")
            else:
                print("✅ Author column already exists")
            
            # Update existing challenges that don't have an author
            challenges_updated = Challenge.query.filter(
                (Challenge.author == None) | (Challenge.author == '')
            ).update({'author': 'System'})
            
            db.session.commit()
            
            if challenges_updated > 0:
                print(f"✅ Updated {challenges_updated} challenges with default author 'System'")
            else:
                print("✅ All challenges already have authors assigned")
                
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            db.session.rollback()
        
if __name__ == '__main__':
    print("🔧 Running author field migration...")
    migrate_author_field()
    print("🎉 Migration completed!")
