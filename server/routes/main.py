from flask import Blueprint, jsonify
from extensions import db
from datetime import datetime

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def home():
    return jsonify({
        'message': 'Scholarship Portal API',
        'version': '1.0',
        'status': 'running',
        'endpoints': {
            'auth': {
                'register': 'POST /api/auth/register',
                'login': 'POST /api/auth/login',
                'logout': 'POST /api/auth/logout'
            },
            'profile': {
                'get_profile': 'GET /api/profile/',
                'update_profile': 'PUT /api/profile/',
                'change_password': 'POST /api/profile/change-password'
            },
            'scholarships': {
                'list': 'GET /api/scholarships',
                'get': 'GET /api/scholarships/<id>',
                'create': 'POST /api/scholarships',
                'update': 'PUT /api/scholarships/<id>',
                'delete': 'DELETE /api/scholarships/<id>'
            },
            'applications': {
                'submit': 'POST /api/applications',
                'my_applications': 'GET /api/applications/my-applications',
                'get': 'GET /api/applications/<id>',
                'update': 'PUT /api/applications/<id>'
            },
            'search': {
                'scholarships': 'GET /api/search/scholarships?q=search_term&min_amount=1000',
                'applications': 'GET /api/search/applications?status=pending'
            },
            'admin': {
                'stats': 'GET /api/admin/stats',
                'users': 'GET /api/admin/users',
                'review_application': 'POST /api/admin/applications/<id>/review',
                'toggle_scholarship': 'POST /api/admin/scholarships/<id>/toggle'
            }
        }
    })

@main_bp.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        db.session.execute(db.text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500