from flask import Flask, request, make_response, redirect, url_for, jsonify
import os
from sqlalchemy import text
from extensions import db, login_manager, bcrypt, cors, jwt, mail, migrate
from config import Config, DevelopmentConfig
from models import User

def create_app(config_class=DevelopmentConfig):
    # Initialize Flask app
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.profile import profile_bp
    from routes.scholarships import scholarships_bp
    from routes.applications import applications_bp
    from routes.search import search_bp
    from routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(scholarships_bp, url_prefix='/api/scholarships')
    app.register_blueprint(applications_bp, url_prefix='/api/applications')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            return response

    @app.before_request
    def require_https():
        if app.config.get('FORCE_HTTPS') and request.headers.get('X-Forwarded-Proto') == 'http':
            url = request.url.replace('http://', 'https://', 1)
            return redirect(url, code=301)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5002)

def test_db_connection():
    try:
        with db.engine.connect() as conn:
            # Test the connection
            conn.execute(text("SELECT 1"))
            conn.commit()
        print("Database connection successful!")
        # List all tables
        print("\nAvailable tables:")
        with db.engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            for row in result:
                print(f"- {row[0]}")
    except Exception as e:
        print(f"Database connection failed: {e}")
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return False
    return True

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))  # Default to 5002 to avoid conflicts
    with app.app_context():
        test_db_connection()
    app.run(debug=True, port=port)