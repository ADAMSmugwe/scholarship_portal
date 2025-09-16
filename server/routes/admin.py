from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models import User, Scholarship, Application
from sqlalchemy import func
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/stats', methods=['GET'])
@login_required
def get_stats():
    """Get admin dashboard statistics"""
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    # Get counts
    total_users = User.query.count()
    total_scholarships = Scholarship.query.count()
    active_scholarships = Scholarship.query.filter_by(is_active=True).count()
    total_applications = Application.query.count()

    # Get recent applications (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_applications = Application.query.filter(
        Application.submission_date >= thirty_days_ago
    ).count()

    # Get applications by status
    status_counts = db.session.query(
        Application.status,
        func.count(Application.id)
    ).group_by(Application.status).all()

    status_dict = {status: count for status, count in status_counts}

    return jsonify({
        'total_users': total_users,
        'total_scholarships': total_scholarships,
        'active_scholarships': active_scholarships,
        'total_applications': total_applications,
        'recent_applications': recent_applications,
        'applications_by_status': status_dict
    })

@admin_bp.route('/users', methods=['GET'])
@login_required
def get_users():
    """Get all users (admin only)"""
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    role_filter = request.args.get('role')

    users_query = User.query

    if role_filter:
        users_query = users_query.filter_by(role=role_filter)

    users = users_query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'users': [user.to_dict() for user in users.items],
        'pagination': {
            'page': users.page,
            'per_page': users.per_page,
            'total': users.total,
            'pages': users.pages
        }
    })

@admin_bp.route('/applications/<int:id>/review', methods=['POST'])
@login_required
def review_application(id):
    """Review and update application status (admin only)"""
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    application = Application.query.get_or_404(id)
    data = request.get_json()

    if 'status' in data:
        if data['status'] not in ['pending', 'under_review', 'approved', 'rejected']:
            return jsonify({'error': 'Invalid status'}), 400
        application.status = data['status']

    if 'notes' in data:
        application.notes = data['notes']

    application.reviewed_at = datetime.utcnow()
    application.reviewed_by = current_user.id

    try:
        db.session.commit()
        return jsonify({
            'message': 'Application reviewed successfully',
            'application': application.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update application'}), 500

@admin_bp.route('/scholarships/<int:id>/toggle', methods=['POST'])
@login_required
def toggle_scholarship_status(id):
    """Toggle scholarship active status (admin only)"""
    if current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    scholarship = Scholarship.query.get_or_404(id)
    scholarship.is_active = not scholarship.is_active

    try:
        db.session.commit()
        status = 'activated' if scholarship.is_active else 'deactivated'
        return jsonify({
            'message': f'Scholarship {status} successfully',
            'scholarship': scholarship.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update scholarship status'}), 500
