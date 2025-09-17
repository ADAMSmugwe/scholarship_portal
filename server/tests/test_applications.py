import pytest
import json
from flask_jwt_extended import create_access_token


def test_get_user_applications(client, app):
    """Test getting user's applications"""
    with app.app_context():
        # Create user
        from models import User
        user = User(name='Test User', email='test@example.com', role='student')
        user.set_password('password123')
        from extensions import db
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=user.id)

    headers = {'Authorization': f'Bearer {access_token}'}
    response = client.get('/api/applications/my-applications', headers=headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)


def test_create_application(client, app):
    """Test creating an application"""
    with app.app_context():
        # Create user and scholarship
        from models import User, Scholarship
        user = User(name='Test User', email='test@example.com', role='student')
        user.set_password('password123')
        admin = User(name='Admin User', email='admin@example.com', role='admin')
        admin.set_password('password123')
        scholarship = Scholarship(
            title='Test Scholarship',
            description='A test scholarship',
            amount=5000,
            deadline='2024-12-31',
            created_by=admin.id
        )
        from extensions import db
        db.session.add(user)
        db.session.add(admin)
        db.session.add(scholarship)
        db.session.commit()

        scholarship_id = scholarship.id
        access_token = create_access_token(identity=user.id)

    headers = {'Authorization': f'Bearer {access_token}'}
    data = {
        'scholarship_id': scholarship_id,
        'personal_statement': 'I am a dedicated student...',
        'transcript': 'My grades are excellent',
        'recommendation_letters': 'Strong recommendations'
    }
    response = client.post('/api/applications',
                          data=json.dumps(data),
                          content_type='application/json',
                          headers=headers)
    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert 'id' in response_data


def test_create_duplicate_application(client, app):
    """Test creating duplicate application for same scholarship"""
    with app.app_context():
        # Create user and scholarship
        from models import User, Scholarship, Application
        user = User(name='Test User', email='test@example.com', role='student')
        user.set_password('password123')
        admin = User(name='Admin User', email='admin@example.com', role='admin')
        admin.set_password('password123')
        scholarship = Scholarship(
            title='Test Scholarship',
            description='A test scholarship',
            amount=5000,
            deadline='2024-12-31',
            created_by=admin.id
        )
        from extensions import db
        db.session.add(user)
        db.session.add(admin)
        db.session.add(scholarship)
        db.session.commit()

        # Create first application
        application = Application(
            user_id=user.id,
            scholarship_id=scholarship.id,
            personal_statement='First application'
        )
        db.session.add(application)
        db.session.commit()

        scholarship_id = scholarship.id
        access_token = create_access_token(identity=user.id)

    headers = {'Authorization': f'Bearer {access_token}'}
    data = {
        'scholarship_id': scholarship_id,
        'personal_statement': 'Duplicate application',
    }
    response = client.post('/api/applications',
                          data=json.dumps(data),
                          content_type='application/json',
                          headers=headers)
    assert response.status_code == 400


def test_get_application_detail(client, app):
    """Test getting application details"""
    with app.app_context():
        # Create user, scholarship, and application
        from models import User, Scholarship, Application
        user = User(name='Test User', email='test@example.com', role='student')
        user.set_password('password123')
        admin = User(name='Admin User', email='admin@example.com', role='admin')
        admin.set_password('password123')
        scholarship = Scholarship(
            title='Test Scholarship',
            description='A test scholarship',
            amount=5000,
            deadline='2024-12-31',
            created_by=admin.id
        )
        application = Application(
            user_id=user.id,
            scholarship_id=scholarship.id,
            personal_statement='My application statement'
        )
        from extensions import db
        db.session.add(user)
        db.session.add(admin)
        db.session.add(scholarship)
        db.session.add(application)
        db.session.commit()

        application_id = application.id
        access_token = create_access_token(identity=user.id)

    headers = {'Authorization': f'Bearer {access_token}'}
    response = client.get(f'/api/applications/{application_id}', headers=headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['personal_statement'] == 'My application statement'


def test_update_application(client, app):
    """Test updating an application"""
    with app.app_context():
        # Create user, scholarship, and application
        from models import User, Scholarship, Application
        user = User(name='Test User', email='test@example.com', role='student')
        user.set_password('password123')
        admin = User(name='Admin User', email='admin@example.com', role='admin')
        admin.set_password('password123')
        scholarship = Scholarship(
            title='Test Scholarship',
            description='A test scholarship',
            amount=5000,
            deadline='2024-12-31',
            created_by=admin.id
        )
        application = Application(
            user_id=user.id,
            scholarship_id=scholarship.id,
            personal_statement='Original statement'
        )
        from extensions import db
        db.session.add(user)
        db.session.add(admin)
        db.session.add(scholarship)
        db.session.add(application)
        db.session.commit()

        application_id = application.id
        access_token = create_access_token(identity=user.id)

    headers = {'Authorization': f'Bearer {access_token}'}
    update_data = {
        'personal_statement': 'Updated statement'
    }
    response = client.put(f'/api/applications/{application_id}',
                         data=json.dumps(update_data),
                         content_type='application/json',
                         headers=headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['personal_statement'] == 'Updated statement'


def test_delete_application(client, app):
    """Test deleting an application"""
    with app.app_context():
        # Create user, scholarship, and application
        from models import User, Scholarship, Application
        user = User(name='Test User', email='test@example.com', role='student')
        user.set_password('password123')
        admin = User(name='Admin User', email='admin@example.com', role='admin')
        admin.set_password('password123')
        scholarship = Scholarship(
            title='Test Scholarship',
            description='A test scholarship',
            amount=5000,
            deadline='2024-12-31',
            created_by=admin.id
        )
        application = Application(
            user_id=user.id,
            scholarship_id=scholarship.id,
            personal_statement='Statement to delete'
        )
        from extensions import db
        db.session.add(user)
        db.session.add(admin)
        db.session.add(scholarship)
        db.session.add(application)
        db.session.commit()

        application_id = application.id
        access_token = create_access_token(identity=user.id)

    headers = {'Authorization': f'Bearer {access_token}'}
    response = client.delete(f'/api/applications/{application_id}', headers=headers)
    assert response.status_code == 200

    # Verify it's deleted
    response = client.get(f'/api/applications/{application_id}', headers=headers)
    assert response.status_code == 404
