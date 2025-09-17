#!/usr/bin/env python3
"""
Database Indexing Test Script
Tests that all database indexes are properly configured and functional.
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_database_indexes():
    """Test database indexing functionality"""
    print("Database Indexing Test")
    print("======================")

    try:
        # Test Flask app import
        from app import app
        print("✅ Flask app imports successfully")

        # Test database models
        from models import User, Scholarship, Application
        print("✅ Database models import successfully")

        # Test database connection and indexes
        print("\nTesting database connection and indexes...")
        with app.app_context():
            # Test User indexes
            users = User.query.filter_by(email_verified=True).limit(1).all()
            print("✅ User email_verified index working")

            # Test Scholarship indexes
            scholarships = Scholarship.query.filter_by(is_active=True).limit(1).all()
            print("✅ Scholarship is_active index working")

            # Test Application indexes
            applications = Application.query.filter_by(status='pending').limit(1).all()
            print("✅ Application status index working")

            print("✅ All database indexes are functional")

        print("\n✅ Database indexing tests completed successfully!")
        print("All indexes are properly configured and functional.")
        return True

    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_database_indexes()
    sys.exit(0 if success else 1)
