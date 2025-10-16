#!/usr/bin/env python3
"""
Script to fix challenge file_attachments data structure
"""

import os
import sys
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import db
from models.challenge import Challenge

def fix_challenge_files():
    """Fix the file_attachments structure for existing challenges"""
    
    with app.app_context():
        # Get all challenges that have file_attachments
        challenges = Challenge.query.filter(Challenge.file_attachments.isnot(None)).all()
        
        print(f"Found {len(challenges)} challenges with file attachments")
        
        for challenge in challenges:
            print(f"\nProcessing Challenge {challenge.id}: {challenge.title}")
            print(f"Current file_attachments: {challenge.file_attachments}")
            
            # Check if it's already in the correct format
            if isinstance(challenge.file_attachments, list) and len(challenge.file_attachments) > 0:
                # Check if the first item has the expected structure
                first_file = challenge.file_attachments[0]
                if isinstance(first_file, dict) and 'filename' in first_file and 'name' in first_file:
                    print("  ✓ Already in correct format")
                    continue
            
            # Convert old format to new format
            if isinstance(challenge.file_attachments, list):
                new_files = []
                for file_data in challenge.file_attachments:
                    if isinstance(file_data, str):
                        # Old format: just filename string
                        new_files.append({
                            'name': file_data,
                            'filename': file_data,  # Use same name for filename
                            'size': 'Unknown',
                            'url': f'/api/files/download/{file_data}'
                        })
                    elif isinstance(file_data, dict):
                        # Check if it needs conversion
                        if 'filename' not in file_data:
                            # Convert old dict format
                            new_files.append({
                                'name': file_data.get('name', file_data.get('filename', 'Unknown')),
                                'filename': file_data.get('filename', file_data.get('name', 'Unknown')),
                                'size': file_data.get('size', 'Unknown'),
                                'url': f'/api/files/download/{file_data.get("filename", file_data.get("name", "Unknown"))}'
                            })
                        else:
                            # Already in correct format
                            new_files.append(file_data)
                
                challenge.file_attachments = new_files
                print(f"  ✓ Converted to new format: {new_files}")
            else:
                print(f"  ⚠ Skipping - unexpected format: {type(challenge.file_attachments)}")
                continue
        
        # Commit changes
        try:
            db.session.commit()
            print(f"\n✅ Successfully updated {len(challenges)} challenges")
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error committing changes: {e}")

if __name__ == "__main__":
    fix_challenge_files()
