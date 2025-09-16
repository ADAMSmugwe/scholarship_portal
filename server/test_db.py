from flask import Flask
from extensions import db
from models import User, Scholarship, Application
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

def test_connection():
    with app.app_context():
        try:
            # Test connection
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            print("✓ Database connection successful!")
            
            # List all tables
            result = db.session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema='public'
            """))
            print("\nDatabase tables:")
            for row in result:
                print(f"- {row[0]}")
                
            # Test models
            print("\nTesting models:")
            print(f"✓ User columns: {User.__table__.columns.keys()}")
            print(f"✓ Scholarship columns: {Scholarship.__table__.columns.keys()}")
            print(f"✓ Application columns: {Application.__table__.columns.keys()}")
            
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == '__main__':
    test_connection()