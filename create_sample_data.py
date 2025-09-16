#!/usr/bin/env python3
"""
Sample data creation script for Scholarship Portal
Adds some initial scholarships and test data
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'server'))

from app import app, db
from models import User, Scholarship
from datetime import datetime, timedelta

def create_sample_data():
    """Create sample scholarships and users for testing"""

    with app.app_context():
        # Check if data already exists
        if Scholarship.query.count() > 0:
            print("Sample data already exists!")
            return

        # Create admin user
        admin = User.query.filter_by(email='admin@scholarshipportal.com').first()
        if not admin:
            admin = User(
                name='Admin User',
                email='admin@scholarshipportal.com',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("✅ Created admin user: admin@scholarshipportal.com / admin123")

        # Create sample scholarships
        scholarships_data = [
            {
                'title': 'STEM Excellence Scholarship',
                'description': 'Awarded to outstanding students in Science, Technology, Engineering, and Mathematics fields.',
                'amount': 5000.00,
                'deadline': datetime.now() + timedelta(days=60),
                'eligibility_criteria': 'GPA 3.5+, STEM major, Full-time student',
                'contact_email': 'stem@scholarshipportal.com',
                'website': 'https://scholarshipportal.com/stem'
            },
            {
                'title': 'Community Service Award',
                'description': 'Recognizing students who have made significant contributions to their community through volunteer work.',
                'amount': 2500.00,
                'deadline': datetime.now() + timedelta(days=45),
                'eligibility_criteria': 'Minimum 100 hours of community service, Good academic standing',
                'contact_email': 'community@scholarshipportal.com',
                'website': 'https://scholarshipportal.com/community'
            },
            {
                'title': 'First Generation Student Fund',
                'description': 'Supporting first-generation college students in their educational journey.',
                'amount': 3000.00,
                'deadline': datetime.now() + timedelta(days=90),
                'eligibility_criteria': 'First-generation college student, Demonstrated financial need',
                'contact_email': 'firstgen@scholarshipportal.com',
                'website': 'https://scholarshipportal.com/firstgen'
            },
            {
                'title': 'Arts & Humanities Scholarship',
                'description': 'Supporting students pursuing degrees in arts, literature, philosophy, and related fields.',
                'amount': 4000.00,
                'deadline': datetime.now() + timedelta(days=75),
                'eligibility_criteria': 'Arts/Humanities major, Portfolio submission required',
                'contact_email': 'arts@scholarshipportal.com',
                'website': 'https://scholarshipportal.com/arts'
            }
        ]

        for scholarship_data in scholarships_data:
            scholarship = Scholarship(
                **scholarship_data,
                created_by=admin.id,
                is_active=True
            )
            db.session.add(scholarship)

        db.session.commit()
        print(f"✅ Created {len(scholarships_data)} sample scholarships")

        # Print summary
        print("\n📊 Sample Data Summary:")
        print(f"   Admin User: admin@scholarshipportal.com")
        print(f"   Password: admin123")
        print(f"   Scholarships: {Scholarship.query.count()}")
        print("\n🎯 Ready for testing!")

if __name__ == '__main__':
    create_sample_data()
