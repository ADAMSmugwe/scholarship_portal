from flask import Flask
import os
from flask_mail import Mail
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Enable CORS
cors = CORS(app)

# Configure mail settings
app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME='your-email@gmail.com',  # Replace with your Gmail email
    MAIL_PASSWORD='your-app-password',      # Replace with your Gmail app password
    MAIL_DEFAULT_SENDER='your-email@gmail.com'
)

# Initialize Flask-Mail
mail = Mail(app)

@app.route('/test-email', methods=['GET'])
def test_email():
    try:
        msg = mail.send_message(
            subject='Test Email',
            recipients=['test@example.com'],
            body='This is a test email to verify that the email configuration works.'
        )
        return {'success': True, 'message': 'Email sent successfully'}
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)

# Initialize extensions
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

# Configure CORS
cors.init_app(app, 
    resources={r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "expose_headers": ["Content-Type", "Authorization"]
    }},
    send_wildcard=False)
db.init_app(app)
migrate.init_app(app, db)
cache.init_app(app)
cors.init_app(app, 
              origins=app.config['CORS_ORIGINS'], 
              supports_credentials=True,
              methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
              allow_headers=["Content-Type", "Authorization"])

# Security headers middleware
@app.after_request
def add_security_headers(response):
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # Enable XSS protection
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Content Security Policy (basic)
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    return response

# HTTPS redirection middleware
@app.before_request
def https_redirect():
    if app.config.get('FORCE_HTTPS') and request.headers.get('X-Forwarded-Proto') == 'http':
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)
bcrypt.init_app(app)
login_manager.init_app(app)
jwt.init_app(app)
mail.init_app(app)

# JWT user loader
@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return db.session.query(User).get(int(identity))

@login_manager.user_loader
def load_user(user_id):
    return db.session.query(User).get(int(user_id))
login_manager.login_view = 'auth.login'

# Import models and blueprints
from models import User, Scholarship, Application
from routes import main_bp, auth_bp, scholarships_bp, applications_bp, profile_bp, search_bp, admin_bp

app.register_blueprint(main_bp)
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(scholarships_bp, url_prefix='/api/scholarships')
app.register_blueprint(applications_bp, url_prefix='/api/applications')
app.register_blueprint(profile_bp, url_prefix='/api/profile')
app.register_blueprint(search_bp, url_prefix='/api/search')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Apply specific rate limits to endpoints
with app.app_context():
    limiter.limit("5/hour", methods=["POST"])(app.view_functions['auth.register'])
    limiter.limit("10/hour", methods=["POST"])(app.view_functions['auth.login'])
    limiter.limit("3/hour", methods=["POST"])(app.view_functions['applications.submit_application'])

@app.route('/')
def home():
    return jsonify({
        'message': 'Scholarship Portal API',
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

def test_db_connection():
    try:
        with db.engine.connect() as conn:
            # Test the connection
            conn.execute(text("SELECT 1"))
            conn.commit()  # Ensure the transaction is committed
        print("Database connection successful!")
        # List all tables
        print("\nAvailable tables:")
        with db.engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            for row in result:
                print(f"- {row[0]}")
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return False
    return True

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))  # Default to 5002 to avoid conflicts
    with app.app_context():
        test_db_connection()
    app.run(debug=True, port=port)