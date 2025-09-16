from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models import Application, Scholarship

applications_bp = Blueprint('applications', __name__)

@applications_bp.route('/', methods=['POST'])
@login_required
def submit_application():
    data = request.get_json()
    scholarship = Scholarship.query.get_or_404(data['scholarship_id'])
    
    application = Application(
        student_id=current_user.id,
        scholarship_id=scholarship.id,
        status='pending'
    )
    db.session.add(application)
    db.session.commit()
    return jsonify({'message': 'Application submitted successfully'}), 201

@applications_bp.route('/my-applications', methods=['GET'])
@login_required
def get_user_applications():
    applications = Application.query.filter_by(student_id=current_user.id).all()
    return jsonify([{
        'id': app.id,
        'scholarship_id': app.scholarship_id,
        'created_at': app.created_at.isoformat(),
        'status': app.status
    } for app in applications])

@applications_bp.route('/<int:id>', methods=['GET'])
@login_required
def get_application(id):
    application = Application.query.get_or_404(id)
    if application.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    return jsonify({
        'id': application.id,
        'scholarship_id': application.scholarship_id,
        'submission_date': application.submission_date.isoformat(),
        'status': application.status,
        'essay': application.essay
    })

@applications_bp.route('/apply', methods=['POST'])
@login_required
def apply_for_scholarship():
    """Creates a new application for a scholarship."""
    data = request.get_json()

    if not data or 'scholarship_id' not in data:
        return jsonify({'error': 'scholarship_id is required'}), 400

    scholarship_id = data.get('scholarship_id')
    student_id = current_user.id  # Use the logged-in user's ID for security

    # Check if the scholarship exists
    scholarship = Scholarship.query.get(scholarship_id)
    if not scholarship:
        return jsonify({'error': 'Scholarship not found'}), 404

    # Check if the user has already applied
    existing_application = Application.query.filter_by(
        student_id=student_id,
        scholarship_id=scholarship_id
    ).first()

    if existing_application:
        return jsonify({'error': 'You have already applied for this scholarship'}), 409

    # Create a new application
    new_application = Application(
        student_id=student_id,
        scholarship_id=scholarship_id,
        status='Pending'
    )

    try:
        db.session.add(new_application)
        db.session.commit()
        return jsonify({'message': 'Application submitted successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit application'}), 500