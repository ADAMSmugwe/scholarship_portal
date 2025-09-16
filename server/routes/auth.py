from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required
from flask_jwt_extended import create_access_token, jwt_required
from extensions import db
from models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400

    if db.session.query(User).filter_by(email=data['email']).first():
        return jsonify({'error': 'User already exists'}), 400
    
    user = User(
        name=data.get('name'),
        email=data['email'],
        role=data.get('role', 'student')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    user = db.session.query(User).filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        # Don't use login_user for JWT - it's not needed
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token, message='Logged in successfully')
        
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # For JWT, logout is handled client-side by removing the token
    # No server-side session to destroy
    return jsonify({'message': 'Logged out successfully'})