#!/usr/bin/env python3

import sys
import os
sys.path.append('/var/www/auto-trader-ai/backend/src')

from models.user import User
from flask import Flask
from config.database import db

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://autotrader:autotrader123@localhost/autotrader_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    print("=== Authentication Debug ===")
    
    # Find user
    user = User.query.filter_by(email='kelebra96@gmail.com').first()
    
    if user:
        print(f"User found: {user.email}")
        print(f"Password hash: {user.password_hash[:50]}...")
        print(f"Has check_password method: {hasattr(user, 'check_password')}")
        
        if hasattr(user, 'check_password'):
            try:
                result = user.check_password('admin123456')
                print(f"Password check result: {result}")
            except Exception as e:
                print(f"Error checking password: {e}")
        
        # Check user attributes
        print(f"User attributes: {[attr for attr in dir(user) if not attr.startswith('_')]}")
        
    else:
        print("User not found")
        
    # List all users
    print("\nAll users in database:")
    users = User.query.all()
    for u in users:
        print(f"  {u.email} - {u.password_hash[:30]}...")