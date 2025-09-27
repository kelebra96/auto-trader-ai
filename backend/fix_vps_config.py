#!/usr/bin/env python3
"""
Script to fix VPS backend configuration to use MySQL instead of SQLite
"""

import os
import subprocess
import sys

def create_env_file():
    """Create .env file with MySQL configuration for VPS"""
    env_content = """# MySQL Configuration for VPS
USE_MYSQL=true
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=autotrader
MYSQL_PASSWORD=autotrader123
MYSQL_DATABASE=autotrader_db

# Flask Configuration
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Environment
FLASK_ENV=production
"""
    
    return env_content

def main():
    print("Creating .env file for VPS MySQL configuration...")
    env_content = create_env_file()
    
    # Write to local file first
    with open('.env.vps', 'w') as f:
        f.write(env_content)
    
    print("Created .env.vps file with MySQL configuration")
    print("\nNext steps:")
    print("1. Upload this .env file to VPS at /var/www/auto-trader-ai/backend/.env")
    print("2. Restart the backend service")
    print("3. Test login functionality")
    
    print("\nCommands to run on VPS:")
    print("cd /var/www/auto-trader-ai/backend")
    print("# Kill existing processes")
    print("pkill -f 'python.*main_simple.py'")
    print("# Start with new configuration")
    print("nohup python src/main_simple.py > backend.log 2>&1 &")

if __name__ == "__main__":
    main()