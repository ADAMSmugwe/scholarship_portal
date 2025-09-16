from flask import Blueprint, jsonify

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def home():
    return jsonify({
        'message': 'Scholarship Portal API',
        'version': '1.0',
        'status': 'running',
        'endpoints': {
            'auth': {
                'register': '/api/auth/register [POST]',
                'login': '/api/auth/login [POST]',
                'logout': '/api/auth/logout [GET]'
            },
            'scholarships': {
                'list': '/api/scholarships [GET]',
                'create': '/api/scholarships [POST]',
                'get': '/api/scholarships/<id> [GET]'
            },
            'applications': {
                'submit': '/api/applications [POST]',
                'list': '/api/applications [GET]',
                'get': '/api/applications/<id> [GET]'
            }
        }
    })