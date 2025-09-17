import pytest
import json
from flask_jwt_extended import create_access_token


def test_get_scholarships(client):
    """Test getting all scholarships"""
    response = client.get('/api/scholarships')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)


def test_create_scholarship(client, app):
    """Test creating a scholarship (requires admin)"""
    with app.app_context():
        # Create admin user
        from models import User
        admin = User(name='Admin User', email='admin@example.com', role='admin')
        admin.set_password('password123')
        from extensions import db
        db.session.add(admin)
        db.session.commit()

        access_token = create_access_token(identity=str(admin.id))

    headers = {'Authorization': f'Bearer {access_token}'}
    data = {
        'title': 'Test Scholarship',
        'description': 'A test scholarship',
        'amount': 5000,
        'deadline': '2024-12-31'
    }
    response = client.post('/api/scholarships/',
                          data=json.dumps(data),
                          content_type='application/json',
                          headers=headers)
    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert 'id' in response_data
    assert response_data['message'] == 'Scholarship created successfully'


def test_create_scholarship_unauthorized(client, app):
    """Test creating scholarship without admin role"""
    with app.app_context():
        # Create regular user
        from models import User
        user = User(name='Regular User', email='user@example.com', role='student')
        user.set_password('password123')
        from extensions import db
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))

    headers = {'Authorization': f'Bearer {access_token}'}
    data = {
        'title': 'Test Scholarship',
        'description': 'A test scholarship',
        'amount': 5000,
        'deadline': '2024-12-31'
    }
    response = client.post('/api/scholarships/',
                          data=json.dumps(data),
                          content_type='application/json',
                          headers=headers)
    assert response.status_code == 403


def test_get_scholarship_detail(client, app):
    """Test getting a specific scholarship"""
    with app.app_context():
        # Create a scholarship first
        from models import Scholarship, User
        admin = User(name='Admin User', email='admin@example.com', role='admin')
        admin.set_password('password123')
        scholarship = Scholarship(
            title='Test Scholarship',
            description='A test scholarship',
            amount=5000,
            deadline='2024-12-31',
            eligibility_criteria='Undergraduate students',
            created_by=admin.id
        )
        from extensions import db
        db.session.add(admin)
        db.session.add(scholarship)
        db.session.commit()
        scholarship_id = scholarship.id

    response = client.get(f'/api/scholarships/{scholarship_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['title'] == 'Test Scholarship'
