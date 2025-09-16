from .main import main_bp
from .auth import auth_bp
from .scholarships import scholarships_bp
from .applications import applications_bp
from .profile import profile_bp
from .search import search_bp
from .admin import admin_bp

__all__ = ['main_bp', 'auth_bp', 'scholarships_bp', 'applications_bp', 'profile_bp', 'search_bp', 'admin_bp']