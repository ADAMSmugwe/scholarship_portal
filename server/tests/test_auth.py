import pytest
import json
from flask_jwt_extended import create_access_token


def test_register_user(client):
    """Test user registration"""
    data = {
        'name': 'Test User',
        'email': 'test@example.com',
        'password': 'password123',
        'role': 'student'
    }
    response = client.post('/api/auth/register',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert 'message' in response_data
    assert response_data['message'] == 'User registered successfully'


def test_register_duplicate_email(client):
    """Test registering with duplicate email"""
    data = {
        'name': 'Test User',
        'email': 'test@example.com',
        'password': 'password123',
        'role': 'student'
    }
    # First registration
    client.post('/api/auth/register',
               data=json.dumps(data),
               content_type='application/json')

    # Second registration with same email
    response = client.post('/api/auth/register',
                          data=json.dumps(data),
                          content_type='application/json')
    assert response.status_code == 400


def test_login_user(client):
    """Test user login"""
    # First register
    register_data = {
        'name': 'Test User',
        'email': 'test@example.com',
        'password': 'password123',
        'role': 'student'
    }
    client.post('/api/auth/register',
               data=json.dumps(register_data),
               content_type='application/json')

    # Then login
    login_data = {
        'email': 'test@example.com',
        'password': 'password123'
    }
    response = client.post('/api/auth/login',
                          data=json.dumps(login_data),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data
    assert 'message' in data
    assert data['message'] == 'Logged in successfully'


def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    login_data = {
        'email': 'nonexistent@example.com',
        'password': 'wrongpassword'
    }
    response = client.post('/api/auth/login',
                          data=json.dumps(login_data),
                          content_type='application/json')
    assert response.status_code == 401


def test_logout_user(client, app):
    """Test user logout"""
    with app.app_context():
        # Create a test token
        from models import User
        user = User(name='Test User', email='test@example.com', role='student')
        user.set_password('password123')
        from extensions import db
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))

    headers = {'Authorization': f'Bearer {access_token}'}
    response = client.post('/api/auth/logout', headers=headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data


def test_get_current_user(client, app):
    """Test getting current user info"""
    with app.app_context():
        # Create a test token
        from models import User
        from flask_jwt_extended import create_access_token
        user = User(name='Test User', email='test@example.com', role='student')
        user.set_password('password123')
        from extensions import db
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))

        headers = {'Authorization': f'Bearer {access_token}'}
        response = client.get('/api/profile/', headers=headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['email'] == 'test@example.com'
        assert data['name'] == 'Test User'
