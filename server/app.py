from flask import Flask, jsonify
from config import Config
from extensions import db, migrate, cors, bcrypt, login_manager, jwt

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
migrate.init_app(app, db)
cors.init_app(app)
bcrypt.init_app(app)
login_manager.init_app(app)
jwt.init_app(app)
login_manager.login_view = 'auth.login'

# Import models and blueprints
from models import User, Scholarship, Application
from routes import main_bp, auth_bp, scholarships_bp, applications_bp

app.register_blueprint(main_bp)
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(scholarships_bp, url_prefix='/api/scholarships')
app.register_blueprint(applications_bp, url_prefix='/api/applications')

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
            conn.execute("SELECT 1")
        print("Database connection successful!")
        # List all tables
        print("\nAvailable tables:")
        result = db.engine.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        for row in result:
            print(f"- {row[0]}")
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return False
    return True

if __name__ == '__main__':
    test_db_connection()
    app.run(debug=True)