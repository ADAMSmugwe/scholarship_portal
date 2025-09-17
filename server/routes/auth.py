from flask import Blueprint, request, jsonify, current_app
from flask_login import login_user, logout_user, login_required
from flask_jwt_extended import create_access_token, jwt_required
from extensions import db, mail
from flask_mail import Message
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
    
    # Generate email verification token
    verification_token = user.generate_verification_token()
    
    db.session.add(user)
    db.session.commit()

    # Send verification email
    msg = Message('Email Verification - Scholarship Portal',
                  sender='noreply@scholarshipportal.com',
                  recipients=[user.email])
    msg.body = f'''Welcome to the Scholarship Portal, {user.name}!

Please verify your email address by clicking the link below:
{request.host_url.rstrip('/')}/verify-email/{verification_token}

This link will expire in 24 hours.

If you did not create this account, please ignore this email.
'''
    try:
        mail.send(msg)
        return jsonify({'message': 'User registered successfully. Please check your email to verify your account.'}), 201
    except Exception as e:
        print(f"Email sending failed: {e}")
        # In development, log the verification link to console
        if current_app.config.get('DEBUG', False):
            print(f"\n{'='*60}")
            print(f"📧 DEVELOPMENT MODE - EMAIL VERIFICATION LINK:")
            print(f"🔗 http://localhost:3000/verify-email/{verification_token}")
            print(f"{'='*60}\n")
            return jsonify({
                'message': 'User registered successfully. Check the console for the verification link.',
                'verification_link': f"http://localhost:3000/verify-email/{verification_token}"
            }), 201
        else:
            return jsonify({'message': 'User registered successfully, but verification email could not be sent. Please contact support.'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    user = db.session.query(User).filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        if not user.email_verified:
            return jsonify({'error': 'Please verify your email address before logging in'}), 403
        
        # Don't use login_user for JWT - it's not needed
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token, message='Logged in successfully')
        
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # For JWT, logout is handled client-side by removing the token
    # No server-side session to destroy
    return jsonify({'message': 'Logged out successfully'})

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400

    user = db.session.query(User).filter_by(email=data['email']).first()
    if not user:
        # Don't reveal if email exists or not for security
        return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200

    # Generate reset token
    token = user.generate_reset_token()
    db.session.commit()

    # Send reset email
    msg = Message('Password Reset Request',
                  sender='noreply@scholarshipportal.com',
                  recipients=[user.email])
    msg.body = f'''To reset your password, visit the following link:
{request.host_url}reset-password/{token}

If you did not make this request, simply ignore this email.
'''
    try:
        mail.send(msg)
        return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200
    except Exception as e:
        print(f"Email sending failed: {e}")
        return jsonify({'error': 'Failed to send reset email'}), 500

@auth_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    data = request.get_json()
    if not data or not data.get('password'):
        return jsonify({'error': 'New password is required'}), 400

    # Find user by token
    user = db.session.query(User).filter_by(password_reset_token=token).first()
    if not user or not user.verify_reset_token(token):
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    # Update password and clear reset token
    user.set_password(data['password'])
    user.clear_reset_token()
    db.session.commit()

    return jsonify({'message': 'Password has been reset successfully'}), 200

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    # Find user by verification token
    user = db.session.query(User).filter_by(email_verification_token=token).first()
    if not user:
        return jsonify({'error': 'Invalid verification token'}), 400

    if user.verify_email_token(token):
        db.session.commit()
        return jsonify({'message': 'Email verified successfully! You can now log in.'}), 200
    else:
        return jsonify({'error': 'Verification token has expired'}), 400