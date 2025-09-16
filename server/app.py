from flask import Flask, jsonify
import os
from config import Config
from extensions import db, migrate, cors, bcrypt, login_manager, jwt
from sqlalchemy import text

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
migrate.init_app(app, db)
cors.init_app(app, 
              origins=["http://localhost:3000"], 
              supports_credentials=True,
              methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
              allow_headers=["Content-Type", "Authorization"])
bcrypt.init_app(app)
login_manager.init_app(app)
jwt.init_app(app)

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