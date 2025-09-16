#!/usr/bin/env python3
"""
Database initialization script for Scholarship Portal
This script creates the core database tables using psycopg2
"""

import psycopg2
from psycopg2 import sql
import sys
import os

# Database connection parameters
# Update these with your PostgreSQL credentials
DB_CONFIG = {
    'host': 'localhost',
    'database': 'scholarship_db',
    'user': 'macbook',  # Your system username
    'password': '',  # Leave empty for local PostgreSQL with trust authentication
    'port': 5432
}

def create_tables():
    """Create all database tables"""

    # SQL statements for table creation
    create_users_table = """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

    create_scholarships_table = """
    CREATE TABLE IF NOT EXISTS scholarships (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        eligibility_criteria TEXT,
        deadline DATE,
        amount DECIMAL(10,2),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
    );
    """

    create_applications_table = """
    CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        scholarship_id INTEGER REFERENCES scholarships(id) NOT NULL,
        status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected')),
        application_answers JSONB,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, scholarship_id)
    );
    """

    # Index creation statements
    create_indexes = """
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_scholarships_deadline ON scholarships(deadline);
    CREATE INDEX IF NOT EXISTS idx_scholarships_active ON scholarships(is_active);
    CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_applications_scholarship ON applications(scholarship_id);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    """

    # List of SQL statements to execute
    sql_statements = [
        create_users_table,
        create_scholarships_table,
        create_applications_table,
        create_indexes
    ]

    conn = None
    try:
        print("Connecting to PostgreSQL database...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True  # Enable autocommit for CREATE statements

        with conn.cursor() as cursor:
            print("Creating tables...")

            for i, statement in enumerate(sql_statements, 1):
                print(f"Executing statement {i}/{len(sql_statements)}...")
                cursor.execute(statement)

            print("All tables created successfully!")

            # Verify tables were created
            print("\nVerifying table creation...")
            cursor.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('users', 'scholarships', 'applications')
                ORDER BY table_name;
            """)

            tables = cursor.fetchall()
            print("Created tables:")
            for table in tables:
                print(f"- {table[0]}")

    except psycopg2.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()
            print("Database connection closed.")

def main():
    print("Scholarship Portal Database Initialization")
    print("=" * 50)

    # Check if credentials are set
    if DB_CONFIG['user'] == 'your_username' or DB_CONFIG['password'] == 'your_password':
        print("ERROR: Please update the DB_CONFIG dictionary with your PostgreSQL credentials!")
        print("Edit the DB_CONFIG section at the top of this script.")
        sys.exit(1)

    create_tables()

    print("\nDatabase initialization completed successfully!")
    print("You can now run your Flask application.")

if __name__ == "__main__":
    main()
