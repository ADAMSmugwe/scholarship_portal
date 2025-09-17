from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, cache
from models import User
from datetime import datetime

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
