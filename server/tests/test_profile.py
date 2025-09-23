import pytest
import json
from datetime import date
from io import BytesIO
from models import User, UserProfile
from extensions import db

@pytest.fixture
def test_user(client, auth):
    """Create a test user, verify email, and log them in"""
    auth.register()
    # Get the user and verify their email
    user = User.query.filter_by(email='test@example.com').first()
    user.email_verified = True
    db.session.commit()
    # Now log in
    auth.login()
    return user

def test_get_profile_empty(client, auth, test_user):
    """Test getting profile when none exists yet"""
    response = client.get('/api/profile/extended',
                         headers={'Authorization': f'Bearer {auth.token}'})
    assert response.status_code == 404

def test_create_profile(client, auth, test_user):
    """Test creating a new profile"""
    profile_data = {
        'date_of_birth': '1995-01-01',
        'phone_number': '123-456-7890',
        'address': '123 Test St',
        'city': 'Test City',
        'state': 'Test State',
        'country': 'Test Country',
        'postal_code': '12345',
        'current_school': 'Test University',
        'major': 'Computer Science',
        'gpa': 3.8,
        'graduation_year': 2026,
        'education_level': 'undergraduate',
        'bio': 'Test bio',
        'achievements': 'Test achievements',
        'extracurricular_activities': 'Test activities'
    }

    response = client.put('/api/profile/extended',
                         headers={'Authorization': f'Bearer {auth.token}',
                                 'Content-Type': 'application/json'},
                         data=json.dumps(profile_data))
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Profile updated successfully'
    assert data['completion_percentage'] > 0

    # Verify profile was created
    response = client.get('/api/profile/extended',
                         headers={'Authorization': f'Bearer {auth.token}'})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['date_of_birth'] == '1995-01-01'
    assert data['phone_number'] == '123-456-7890'
    assert data['current_school'] == 'Test University'
    assert float(data['gpa']) == 3.8

def test_update_profile(client, auth, test_user):
    """Test updating an existing profile"""
    # First create a profile
    test_create_profile(client, auth, test_user)

    # Update some fields
    update_data = {
        'gpa': 3.9,
        'major': 'Software Engineering',
        'bio': 'Updated bio'
    }

    response = client.put('/api/profile/extended',
                         headers={'Authorization': f'Bearer {auth.token}',
                                 'Content-Type': 'application/json'},
                         data=json.dumps(update_data))
    assert response.status_code == 200

    # Verify updates
    response = client.get('/api/profile/extended',
                         headers={'Authorization': f'Bearer {auth.token}'})
    data = json.loads(response.data)
    assert float(data['gpa']) == 3.9
    assert data['major'] == 'Software Engineering'
    assert data['bio'] == 'Updated bio'

def test_upload_document(client, auth, test_user):
    """Test document upload functionality"""
    # Create a dummy PDF file
    pdf_content = b'%PDF-1.4\nTest PDF content'
    pdf_file = (BytesIO(pdf_content), 'test.pdf')

    # Test transcript upload
    response = client.post('/api/profile/upload/transcript',
                          headers={'Authorization': f'Bearer {auth.token}'},
                          data={'file': pdf_file},
                          content_type='multipart/form-data')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'url' in data
    assert data['url'].endswith('.pdf')

    # Test resume upload
    pdf_file = (BytesIO(pdf_content), 'resume.pdf')
    response = client.post('/api/profile/upload/resume',
                          headers={'Authorization': f'Bearer {auth.token}'},
                          data={'file': pdf_file},
                          content_type='multipart/form-data')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'url' in data
    assert data['url'].endswith('.pdf')

def test_invalid_document_type(client, auth, test_user):
    """Test uploading an invalid document type"""
    # Try to upload a text file
    txt_content = b'This is a text file'
    txt_file = (BytesIO(txt_content), 'test.txt')

    response = client.post('/api/profile/upload/transcript',
                          headers={'Authorization': f'Bearer {auth.token}'},
                          data={'file': txt_file},
                          content_type='multipart/form-data')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Invalid file type' in data['error']

def test_profile_completion(client, auth, test_user):
    """Test profile completion percentage calculation"""
    # Create profile with minimal data
    minimal_data = {
        'date_of_birth': '1995-01-01',
        'phone_number': '123-456-7890'
    }

    response = client.put('/api/profile/extended',
                         headers={'Authorization': f'Bearer {auth.token}',
                                 'Content-Type': 'application/json'},
                         data=json.dumps(minimal_data))
    assert response.status_code == 200
    data = json.loads(response.data)
    initial_completion = data['completion_percentage']

    # Add more data and verify completion increases
    full_data = {
        'date_of_birth': '1995-01-01',
        'phone_number': '123-456-7890',
        'address': '123 Test St',
        'city': 'Test City',
        'state': 'Test State',
        'country': 'Test Country',
        'current_school': 'Test University',
        'major': 'Computer Science',
        'education_level': 'undergraduate'
    }

    response = client.put('/api/profile/extended',
                         headers={'Authorization': f'Bearer {auth.token}',
                                 'Content-Type': 'application/json'},
                         data=json.dumps(full_data))
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['completion_percentage'] > initial_completion

def test_unauthorized_access(client):
    """Test accessing profile endpoints without authentication"""
    response = client.get('/api/profile/extended')
    assert response.status_code == 401

    response = client.put('/api/profile/extended',
                         headers={'Content-Type': 'application/json'},
                         data=json.dumps({}))
    assert response.status_code == 401

    response = client.post('/api/profile/upload/transcript',
                          data={'file': (BytesIO(b'test'), 'test.pdf')},
                          content_type='multipart/form-data')
    assert response.status_code == 401
