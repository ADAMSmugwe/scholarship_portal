from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Application, Scholarship, User

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

@applications_bp.route('/my-applications', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_user_applications():
    user_id = get_jwt_identity()
    applications = db.session.query(Application).filter_by(student_id=int(user_id)).all()
    return jsonify([{
        'id': app.id,
        'scholarship_id': app.scholarship_id,
        'created_at': app.created_at.isoformat(),
        'id': app.id,
        'scholarship_id': app.scholarship_id,
        'created_at': app.created_at.isoformat(),
        'status': app.status
    } for app in applications])

@applications_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_application(id):
    user_id = get_jwt_identity()
    application = db.session.query(Application).get(id)
    if not application:
        return jsonify({'error': 'Application not found'}), 404
        
    # Check if user owns this application or is admin
    user = db.session.query(User).get(int(user_id))
    if application.student_id != int(user_id) and user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    return jsonify({
        'id': application.id,
        'scholarship_id': application.scholarship_id,
        'submission_date': application.submission_date.isoformat() if application.submission_date else None,
        'status': application.status,
        'essay': application.essay,
        'reviewed_at': application.reviewed_at.isoformat() if application.reviewed_at else None,
        'notes': application.notes
    })

@applications_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply_for_scholarship():
    """Creates a new application for a scholarship."""
    data = request.get_json()

    if not data or 'scholarship_id' not in data:
        return jsonify({'error': 'scholarship_id is required'}), 400

    scholarship_id = data.get('scholarship_id')
    user_id = get_jwt_identity()
    student_id = int(user_id)  # Use the logged-in user's ID for security

    # Check if the scholarship exists
    scholarship = db.session.query(Scholarship).get(scholarship_id)
    if not scholarship:
        return jsonify({'error': 'Scholarship not found'}), 404

    # Check if the user has already applied
    existing_application = db.session.query(Application).filter_by(
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