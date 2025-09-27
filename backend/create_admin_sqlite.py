#!/usr/bin/env python3
"""
Script to create an admin user in the SQLite database on the VPS
"""

import os
import sys
import requests
import json
from werkzeug.security import generate_password_hash

def create_admin_user():
    """Create admin user directly in the VPS backend"""
    
    # Admin user details
    admin_email = "kelebra96@gmail.com"
    admin_password = "admin123456"
    admin_name = "Admin User"
    
    # Generate password hash using werkzeug (same as the backend)
    password_hash = generate_password_hash(admin_password)
    
    print(f"Generated password hash: {password_hash}")
    
    # Try to register the admin user
    register_url = "http://212.85.17.99:5001/api/auth/register"
    register_data = {
        "email": admin_email,
        "password": admin_password,
        "nome_estabelecimento": admin_name,
        "cargo": "admin"
    }
    
    try:
        print(f"Attempting to register admin user: {admin_email}")
        response = requests.post(register_url, json=register_data)
        print(f"Register response status: {response.status_code}")
        print(f"Register response: {response.text}")
        
        if response.status_code == 200:
            print("Admin user created successfully!")
            return True
        else:
            print(f"Failed to create admin user: {response.text}")
            return False
    except Exception as e:
        print(f"Error creating admin user: {str(e)}")
        return False

def test_login():
    """Test login with the admin user"""
    login_url = "http://212.85.17.99:5001/api/auth/login"
    login_data = {
        "email": "kelebra96@gmail.com",
        "password": "admin123456"
    }
    
    try:
        print(f"Attempting to login with admin user")
        response = requests.post(login_url, json=login_data)
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.text}")
        
        if response.status_code == 200:
            print("Login successful!")
            return True
        else:
            print(f"Login failed: {response.text}")
            return False
    except Exception as e:
        print(f"Error testing login: {str(e)}")
        return False

def main():
    print("=== Creating Admin User in VPS SQLite Database ===")
    
    # First try to login with existing credentials
    print("\nTesting login with existing credentials...")
    if test_login():
        print("Login successful with existing credentials!")
        return
    
    # If login fails, try to create the admin user
    print("\nCreating admin user...")
    if create_admin_user():
        print("\nTesting login with new admin user...")
        test_login()

if __name__ == "__main__":
    main()