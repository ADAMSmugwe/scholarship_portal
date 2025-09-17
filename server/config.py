import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change'
    # PostgreSQL database URI
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://macbook:@localhost:5432/scholarship_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'a-super-secret-jwt-key-change-it'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # Token expires in 1 hour
    
    # Mail configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS') or True
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL') or False
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or 'noreply@scholarshipportal.com'

    # HTTPS/SSL Configuration
    SSL_CERT_PATH = os.environ.get('SSL_CERT_PATH')
    SSL_KEY_PATH = os.environ.get('SSL_KEY_PATH')
    FORCE_HTTPS = os.environ.get('FORCE_HTTPS', 'False').lower() == 'true'

    # Security Headers
    SESSION_COOKIE_SECURE = FORCE_HTTPS
    REMEMBER_COOKIE_SECURE = FORCE_HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # CORS settings for HTTPS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,https://localhost:3000').split(',')

    # Caching Configuration
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'RedisCache' if os.environ.get('REDIS_URL') else 'SimpleCache')
    CACHE_DEFAULT_TIMEOUT = int(os.environ.get('CACHE_DEFAULT_TIMEOUT', '300'))  # 5 minutes
    CACHE_REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_KEY_PREFIX = os.environ.get('CACHE_KEY_PREFIX', 'scholarship_portal')

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://macbook:@localhost:5432/scholarship_db'
    CACHE_TYPE = 'SimpleCache'  # Use simple cache for development
    
    # Development email configuration - log to console instead of sending
    MAIL_SERVER = 'localhost'
    MAIL_PORT = 25
    MAIL_USE_TLS = False
    MAIL_USE_SSL = False
    MAIL_USERNAME = None
    MAIL_PASSWORD = None
    MAIL_DEFAULT_SENDER = 'noreply@scholarshipportal.com'
    MAIL_SUPPRESS_SEND = True  # This will log emails instead of sending them

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    FORCE_HTTPS = True
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True

    # Production CORS - only allow HTTPS origins
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://yourdomain.com').split(',')

    # Production SSL certificates (Let's Encrypt or custom)
    SSL_CERT_PATH = os.environ.get('SSL_CERT_PATH', '/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
    SSL_KEY_PATH = os.environ.get('SSL_KEY_PATH', '/etc/letsencrypt/live/yourdomain.com/privkey.pem')

    # Production caching with Redis
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'postgresql://test:test@localhost:5432/test_db'
    WTF_CSRF_ENABLED = False
    CACHE_TYPE = 'SimpleCache'  # Simple cache for testing

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://macbook:@localhost:5432/scholarship_db'

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    FORCE_HTTPS = True
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True

    # Production CORS - only allow HTTPS origins
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://yourdomain.com').split(',')

    # Production SSL certificates (Let's Encrypt or custom)
    SSL_CERT_PATH = os.environ.get('SSL_CERT_PATH', '/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
    SSL_KEY_PATH = os.environ.get('SSL_KEY_PATH', '/etc/letsencrypt/live/yourdomain.com/privkey.pem')

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'postgresql://test:test@localhost:5432/test_db'
    WTF_CSRF_ENABLED = False