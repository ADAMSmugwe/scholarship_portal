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
        'deadline': '2024-12-31',
        'requirements': 'Good grades',
        'eligibility_criteria': 'Undergraduate students'
    }
    response = client.post('/api/scholarships',
                          data=json.dumps(data),
                          content_type='application/json',
                          headers=headers)
    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert response_data['title'] == 'Test Scholarship'


def test_create_scholarship_unauthorized(client):
    """Test creating scholarship without admin role"""
    with client.application.app_context():
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
    response = client.post('/api/scholarships',
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


def test_update_scholarship(client, app):
    """Test updating a scholarship"""
    with app.app_context():
        # Create admin and scholarship
        from models import Scholarship, User
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
        db.session.add(admin)
        db.session.add(scholarship)
        db.session.commit()
        scholarship_id = scholarship.id
        access_token = create_access_token(identity=admin.id)

    headers = {'Authorization': f'Bearer {access_token}'}
    update_data = {
        'title': 'Updated Scholarship',
        'amount': 6000
    }
    response = client.put(f'/api/scholarships/{scholarship_id}',
                         data=json.dumps(update_data),
                         content_type='application/json',
                         headers=headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['title'] == 'Updated Scholarship'
    assert data['amount'] == 6000


def test_delete_scholarship(client, app):
    """Test deleting a scholarship"""
    with app.app_context():
        # Create admin and scholarship
        from models import Scholarship, User
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
        db.session.add(admin)
        db.session.add(scholarship)
        db.session.commit()
        scholarship_id = scholarship.id
        access_token = create_access_token(identity=admin.id)

    headers = {'Authorization': f'Bearer {access_token}'}
    response = client.delete(f'/api/scholarships/{scholarship_id}', headers=headers)
    assert response.status_code == 200

    # Verify it's deleted
    response = client.get(f'/api/scholarships/{scholarship_id}')
    assert response.status_code == 404
