from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, cache
from models import User, UserProfile
from datetime import datetime
import os
from werkzeug.utils import secure_filename

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/', methods=['GET'])
@jwt_required()
@cache.cached(timeout=120, key_prefix=lambda: f'user_profile_{get_jwt_identity()}')  # Cache for 2 minutes
def get_profile():
    """Get current user's profile"""
    user_id = get_jwt_identity()
    user = db.session.query(User).get(int(user_id))
    return jsonify(user.to_dict())

@profile_bp.route('/', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user's profile"""
    user_id = get_jwt_identity()
    user = db.session.query(User).get(int(user_id))
    data = request.get_json()

    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        # Check if email is already taken
        existing_user = db.session.query(User).filter_by(email=data['email']).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({'error': 'Email already in use'}), 400
        user.email = data['email']

    # Handle password change
    if 'new_password' in data and data['new_password']:
        if 'current_password' not in data or not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is required and must be correct'}), 400
        if len(data['new_password']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters long'}), 400
        user.set_password(data['new_password'])

    try:
        db.session.commit()
        # Clear user profile cache after update
        cache.delete(f'user_profile_{user_id}')
        return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500

@profile_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change current user's password"""
    user_id = get_jwt_identity()
    user = db.session.query(User).get(int(user_id))
    data = request.get_json()

    if not data or 'current_password' not in data or 'new_password' not in data:
        return jsonify({'error': 'Current password and new password are required'}), 400

    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 400

    if len(data['new_password']) < 6:
        return jsonify({'error': 'New password must be at least 6 characters long'}), 400

    user.set_password(data['new_password'])

    try:
        db.session.commit()
        return jsonify({'message': 'Password changed successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to change password'}), 500

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@profile_bp.route('/extended', methods=['GET'])
@jwt_required()
@cache.cached(timeout=120, key_prefix=lambda: f'user_extended_profile_{get_jwt_identity()}')
def get_extended_profile():
    """Get current user's extended profile"""
    user_id = get_jwt_identity()
    profile = db.session.query(UserProfile).filter_by(user_id=user_id).first()
    
    if not profile:
        return jsonify({}), 404
        
    profile_data = {
        'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
        'phone_number': profile.phone_number,
        'address': profile.address,
        'city': profile.city,
        'state': profile.state,
        'country': profile.country,
        'postal_code': profile.postal_code,
        'current_school': profile.current_school,
        'major': profile.major,
        'gpa': profile.gpa,
        'graduation_year': profile.graduation_year,
        'education_level': profile.education_level,
        'transcript_url': profile.transcript_url,
        'resume_url': profile.resume_url,
        'bio': profile.bio,
        'achievements': profile.achievements,
        'extracurricular_activities': profile.extracurricular_activities,
        'completion_percentage': profile.calculate_completion()
    }
    
    return jsonify(profile_data)

@profile_bp.route('/extended', methods=['PUT'])
@jwt_required()
def update_extended_profile():
    """Update current user's extended profile"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    profile = db.session.query(UserProfile).filter_by(user_id=user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)
    
    # Update fields
    if 'date_of_birth' in data:
        profile.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
    if 'phone_number' in data:
        profile.phone_number = data['phone_number']
    if 'address' in data:
        profile.address = data['address']
    if 'city' in data:
        profile.city = data['city']
    if 'state' in data:
        profile.state = data['state']
    if 'country' in data:
        profile.country = data['country']
    if 'postal_code' in data:
        profile.postal_code = data['postal_code']
    if 'current_school' in data:
        profile.current_school = data['current_school']
    if 'major' in data:
        profile.major = data['major']
    if 'gpa' in data:
        profile.gpa = float(data['gpa']) if data['gpa'] else None
    if 'graduation_year' in data:
        profile.graduation_year = int(data['graduation_year']) if data['graduation_year'] else None
    if 'education_level' in data:
        profile.education_level = data['education_level']
    if 'bio' in data:
        profile.bio = data['bio']
    if 'achievements' in data:
        profile.achievements = data['achievements']
    if 'extracurricular_activities' in data:
        profile.extracurricular_activities = data['extracurricular_activities']

    try:
        db.session.commit()
        # Clear cache
        cache.delete(f'user_extended_profile_{user_id}')
        return jsonify({
            'message': 'Profile updated successfully',
            'completion_percentage': profile.calculate_completion()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500

@profile_bp.route('/upload/<field_name>', methods=['POST'])
@jwt_required()
def upload_document(field_name):
    """Upload profile documents (transcript, resume)"""
    if field_name not in ['transcript', 'resume']:
        return jsonify({'error': 'Invalid document type'}), 400
        
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    allowed_extensions = {'pdf', 'doc', 'docx'}
    if not allowed_file(file.filename, allowed_extensions):
        return jsonify({'error': 'Invalid file type. Allowed types: pdf, doc, docx'}), 400
        
    user_id = get_jwt_identity()
    filename = secure_filename(f"{user_id}_{field_name}_{file.filename}")
    uploads_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'documents')
    os.makedirs(uploads_dir, exist_ok=True)
    
    file_path = os.path.join(uploads_dir, filename)
    file.save(file_path)
    
    profile = db.session.query(UserProfile).filter_by(user_id=user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)
    
    # Update the corresponding URL field
    setattr(profile, f"{field_name}_url", f"/uploads/documents/{filename}")
    
    try:
        db.session.commit()
        # Clear cache
        cache.delete(f'user_extended_profile_{user_id}')
        return jsonify({
            'message': f'{field_name.title()} uploaded successfully',
            'url': getattr(profile, f"{field_name}_url")
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to upload {field_name}'}), 500
