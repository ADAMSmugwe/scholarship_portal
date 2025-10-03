from app import create_app, db
from config import DevelopmentConfig

def init_db():
    app = create_app(DevelopmentConfig)
    with app.app_context():
        # Import all models here
        from models import User, UserProfile, Scholarship, Application
        
        # Create all tables
        db.create_all()
        print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
