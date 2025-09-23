import pytest
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app
from extensions import db


class TestConfig:
    """Test configuration with PostgreSQL database"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'postgresql://macbook:@localhost:5432/scholarship_test_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'test-secret-key'
    SECRET_KEY = 'test-secret-key'
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'test_uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    CACHE_TYPE = 'simple'  # Use simple cache for testing
    MAIL_SUPPRESS_SEND = True  # Disable actual email sending


@pytest.fixture
def app():
    """Create and configure a test app instance."""
    app = create_app(TestConfig)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()


@pytest.fixture
def auth(client, app):
    """Authentication helper class"""
    class AuthActions:
        def __init__(self, client):
            self._client = client
            self.token = None

        def register(self, name='Test User', email='test@example.com', password='test123'):
            return self._client.post(
                '/api/auth/register',
                json={'name': name, 'email': email, 'password': password}
            )

        def verify_email(self, user):
            """Directly mark user's email as verified"""
            with app.app_context():
                user.is_verified = True
                db.session.commit()

        def login(self, email='test@example.com', password='test123'):
            response = self._client.post(
                '/api/auth/login',
                json={'email': email, 'password': password}
            )
            data = response.get_json()
            self.token = data.get('access_token')
            return response

        def logout(self):
            return self._client.get('/api/auth/logout')

    return AuthActions(client)


@pytest.fixture
def temp_uploads(app):
    """Create and clean up temporary uploads directory"""
    uploads_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'documents')
    os.makedirs(uploads_dir, exist_ok=True)
    yield uploads_dir
    # Clean up uploaded files after test
    for filename in os.listdir(uploads_dir):
        if filename != '.gitkeep':
            os.remove(os.path.join(uploads_dir, filename))


from models import User

@pytest.fixture
def test_user(auth, app):
    """Create test user"""
    auth.register()
    with app.app_context():
        user = db.session.query(User).filter_by(email='test@example.com').first()
        auth.verify_email(user)  # Verify the email
        auth.login()  # Log in to get a fresh token
        return user
