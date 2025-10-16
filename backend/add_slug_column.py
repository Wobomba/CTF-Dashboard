#!/usr/bin/env python3
"""
Database migration script to add slug column to challenges table
Run this script first to add the slug column to the database
"""

import os
import sys
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import db

def add_slug_column():
    """Add slug column to challenges table"""
    with app.app_context():
        print("Adding slug column to challenges table...")
        
        try:
            # Add the slug column
            db.engine.execute("ALTER TABLE challenges ADD COLUMN slug VARCHAR(250)")
            print("✅ Successfully added slug column to challenges table")
            
            # Create unique index on slug column
            db.engine.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_challenges_slug ON challenges (slug)")
            print("✅ Successfully created unique index on slug column")
            
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("✅ Slug column already exists")
            else:
                print(f"❌ Error adding slug column: {e}")
                return False
        
        return True

if __name__ == '__main__':
    if add_slug_column():
        print("\n🎉 Database migration complete!")
        print("You can now run: python migrate_add_slugs.py")
    else:
        print("\n❌ Database migration failed!")
        sys.exit(1)
