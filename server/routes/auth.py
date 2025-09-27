from flask import Blueprint, request, jsonify, current_app, make_response
from flask_login import login_user, logout_user, login_required
from flask_jwt_extended import create_access_token, jwt_required
from extensions import db, mail
from flask_mail import Message
from models import User
from datetime import datetime, timedelta
import secrets

auth_bp = Blueprint('auth', __name__)

# Add OPTIONS request handling for all routes
@auth_bp.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

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
    
    try:
        # Generate email verification token
        verification_token = user.generate_verification_token()
        db.session.add(user)
        db.session.commit()

        # Send verification email
        verification_url = f"http://localhost:3000/verify-email/{verification_token}"
        
        msg = Message(
            'Welcome to Scholarship Portal - Email Verification',
            sender=('Scholarship Portal', current_app.config['MAIL_USERNAME']),
            recipients=[user.email]
        )
        
        html_content = '\n'.join([
            '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">',
            '    <h2 style="color: #2c3e50;">Welcome to the Scholarship Portal!</h2>',
            f'    <p>Hello {user.name},</p>',
            '    <p>Thank you for registering with the Scholarship Portal. To complete your registration, please verify your email address by clicking the button below:</p>',
            '    <div style="text-align: center; margin: 30px 0;">',
            f'        <a href="{verification_url}" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Verify Email Address</a>',
            '    </div>',
            '    <p>Or copy and paste this link in your browser:</p>',
            f'    <p style="background-color: #f8f9fa; padding: 10px; word-break: break-all;">{verification_url}</p>',
            '    <p><small>This link will expire in 24 hours.</small></p>',
            '</div>'
        ])
        
        msg.html = html_content
        
        mail.send(msg)
        current_app.logger.info(f"Verification email sent to {user.email}")
        
        if current_app.config.get('DEBUG', False):
            print(f"\n{'='*60}")
            print(f"📧 DEVELOPMENT MODE - VERIFICATION LINK:")
            print(f"🔗 {verification_url}")
            print(f"{'='*60}\n")
            
        return jsonify({
            'message': 'User registered successfully. Please check your email to verify your account.',
            'verification_link': verification_url if current_app.config.get('DEBUG', False) else None
        }), 201
            
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to register user or send email: {str(e)}")
        return jsonify({'error': 'Registration failed. Please try again.'}), 500
        <p><small>This link will expire in 24 hours.</small></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px;">If you did not create this account, please ignore this email.</p>
    </div>
    '''
    
    # Plain text version as fallback
    text_body = f'''Welcome to the Scholarship Portal, {user.name}!

Please verify your email address by clicking the link below:
{verification_url}

This link will expire in 24 hours.

If you did not create this account, please ignore this email.
'''
    
    msg = Message(
        'Welcome to Scholarship Portal - Verify Your Email',
        sender=('Scholarship Portal', current_app.config['MAIL_USERNAME']),
        recipients=[user.email]
    )
    msg.body = text_body
    msg.html = html_body
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
        # In development, allow login without email verification
        if not user.email_verified and not current_app.config.get('DEBUG', False):
            return jsonify({'error': 'Please verify your email address before logging in'}), 403
        
        # Create JWT token
        access_token = create_access_token(identity=str(user.id))
        
        # Include user info in response
        return jsonify({
            'access_token': access_token,
            'message': 'Logged in successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'email_verified': user.email_verified
            }
        })
        
    return jsonify({'error': 'Invalid email or password'}), 401

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    """Verify user's email address"""
    user = User.query.filter_by(email_verification_token=token).first()
    
    if not user:
        return jsonify({'error': 'Invalid verification token'}), 400
        
    if user.email_verification_expires and user.email_verification_expires < datetime.utcnow():
        return jsonify({'error': 'Verification token has expired'}), 400
    
    # Mark email as verified
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires = None
    
    db.session.commit()
    
    return jsonify({
        'message': 'Email verified successfully',
        'email': user.email
    }), 200

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend verification email"""
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    if user.email_verified:
        return jsonify({'message': 'Email is already verified'}), 200
        
    # Generate new verification token
    verification_token = user.generate_verification_token()
    verification_url = f"http://localhost:3000/verify-email/{verification_token}"
    
    msg = Message(
        'Scholarship Portal - Email Verification',
        sender=('Scholarship Portal', current_app.config['MAIL_USERNAME']),
        recipients=[user.email]
    )
    
    html_content = '\n'.join([
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">',
        '    <h2 style="color: #2c3e50;">Verify Your Email</h2>',
        f'    <p>Hello {user.name},</p>',
        '    <p>Please verify your email address by clicking the button below:</p>',
        '    <div style="text-align: center; margin: 30px 0;">',
        f'        <a href="{verification_url}" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Verify Email Address</a>',
        '    </div>',
        '    <p>Or copy and paste this link in your browser:</p>',
        f'    <p style="background-color: #f8f9fa; padding: 10px; word-break: break-all;">{verification_url}</p>',
        '    <p><small>This link will expire in 24 hours.</small></p>',
        '</div>'
    ])
    
    msg.html = html_content
    
    try:
        mail.send(msg)
        return jsonify({'message': 'Verification email sent successfully'}), 200
    except Exception as e:
        print(f"Email sending failed: {e}")
        return jsonify({'error': 'Failed to send verification email'}), 500

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

    try:
        # Generate reset token
        token = user.generate_reset_token()
        db.session.commit()

        reset_url = f"http://localhost:3000/reset-password/{token}"
        
        # Send reset email with HTML template
        msg = Message(
            'Password Reset Request - Scholarship Portal',
            sender=('Scholarship Portal', current_app.config['MAIL_USERNAME']),
            recipients=[user.email]
        )
        
        html_content = '\n'.join([
            '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">',
            '    <h2 style="color: #2c3e50;">Password Reset Request</h2>',
            f'    <p>Hello {user.name},</p>',
            '    <p>We received a request to reset your password. Click the button below to create a new password:</p>',
            '    <div style="text-align: center; margin: 30px 0;">',
            f'        <a href="{reset_url}" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Reset Password</a>',
            '    </div>',
            '    <p>Or copy and paste this link in your browser:</p>',
            f'    <p style="background-color: #f8f9fa; padding: 10px; word-break: break-all;">{reset_url}</p>',
            '    <p><small>This link will expire in 24 hours. If you did not request this reset, please ignore this email.</small></p>',
            '</div>'
        ])
        
        msg.html = html_content
        
        mail.send(msg)
        current_app.logger.info(f"Password reset email sent to {user.email}")
        
        if current_app.config.get('DEBUG', False):
            print(f"\n{'='*60}")
            print(f"📧 DEVELOPMENT MODE - PASSWORD RESET LINK:")
            print(f"🔗 {reset_url}")
            print(f"{'='*60}\n")
            
        return jsonify({
            'message': 'If the email exists, a reset link has been sent',
            'reset_link': reset_url if current_app.config.get('DEBUG', False) else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to generate reset token or send email: {str(e)}")
        # In development mode, provide more detailed error
        if current_app.config.get('DEBUG', False):
            return jsonify({
                'error': 'Failed to send reset email',
                'debug_info': str(e)
            }), 500
        else:
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

