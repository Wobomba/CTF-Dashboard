#!/usr/bin/env python3
"""
Test JWT token validation
"""

import sys
import os

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, jwt
from flask_jwt_extended import create_access_token, decode_token
import jwt as pyjwt

def test_jwt():
    with app.app_context():
        # Create a token
        token = create_access_token(identity="1")
        print(f"Created token: {token[:50]}...")
        
        try:
            # Try to decode it
            decoded = decode_token(token)
            print(f"Token decoded successfully: {decoded}")
        except Exception as e:
            print(f"Token decode failed: {e}")
        
        try:
            # Try to decode with PyJWT directly
            secret = app.config['JWT_SECRET_KEY']
            decoded_raw = pyjwt.decode(token, secret, algorithms=['HS256'])
            print(f"Raw JWT decode successful: {decoded_raw}")
        except Exception as e:
            print(f"Raw JWT decode failed: {e}")

if __name__ == '__main__':
    test_jwt()
