from extensions import db, login_manager, bcrypt
from flask_login import UserMixin
from datetime import datetime, timedelta
import secrets

@login_manager.user_loader
def load_user(id):
    from extensions import db
    return db.session.query(User).get(int(id))

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student', index=True)  # student, donor, admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    password_reset_token = db.Column(db.String(100), unique=True, index=True)
    password_reset_expires = db.Column(db.DateTime, index=True)
    email_verified = db.Column(db.Boolean, default=False, index=True)
    email_verification_token = db.Column(db.String(100), unique=True, index=True)
    email_verification_expires = db.Column(db.DateTime, index=True)
    applications = db.relationship('Application', backref='applicant', lazy=True, foreign_keys='Application.student_id')
    reviewed_applications = db.relationship('Application', backref='reviewer', lazy=True, foreign_keys='Application.reviewed_by')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def generate_reset_token(self):
        self.password_reset_token = secrets.token_urlsafe(32)
        self.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        return self.password_reset_token

    def verify_reset_token(self, token):
        if self.password_reset_token == token and self.password_reset_expires > datetime.utcnow():
            return True
        return False

    def clear_reset_token(self):
        self.password_reset_token = None
        self.password_reset_expires = None

    def generate_verification_token(self):
        self.email_verification_token = secrets.token_urlsafe(32)
        self.email_verification_expires = datetime.utcnow() + timedelta(hours=24)  # 24 hours for email verification
        return self.email_verification_token

    def verify_email_token(self, token):
        if self.email_verification_token == token and self.email_verification_expires > datetime.utcnow():
            self.email_verified = True
            self.email_verification_token = None
            self.email_verification_expires = None
            return True
        return False

    def __repr__(self):
        return f'<User {self.email}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'email_verified': self.email_verified
        }


class UserProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    # Personal Information
    date_of_birth = db.Column(db.Date)
    phone_number = db.Column(db.String(20))
    address = db.Column(db.String(200))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    country = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    
    # Academic Information
    current_school = db.Column(db.String(200))
    major = db.Column(db.String(100))
    gpa = db.Column(db.Float)
    graduation_year = db.Column(db.Integer)
    education_level = db.Column(db.String(50))  # high school, undergraduate, graduate
    
    # Documents
    transcript_url = db.Column(db.String(500))
    resume_url = db.Column(db.String(500))
    
    # Additional Information
    bio = db.Column(db.Text)
    achievements = db.Column(db.Text)
    extracurricular_activities = db.Column(db.Text)
    
    # Profile Status
    is_complete = db.Column(db.Boolean, default=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('profile', uselist=False))
    
    def calculate_completion(self):
        """Calculate profile completion percentage"""
        required_fields = ['date_of_birth', 'phone_number', 'address', 'city', 'state', 
                         'country', 'current_school', 'major', 'education_level']
        optional_fields = ['gpa', 'graduation_year', 'transcript_url', 'resume_url', 
                         'bio', 'achievements', 'extracurricular_activities']
        
        completed = sum(1 for field in required_fields if getattr(self, field) is not None)
        optional_completed = sum(1 for field in optional_fields if getattr(self, field) is not None)
        
        # Required fields count more towards completion
        completion = (completed / len(required_fields) * 0.7 + 
                     optional_completed / len(optional_fields) * 0.3)
        
        self.is_complete = completion >= 0.8  # Profile is complete if 80% or more fields are filled
        return round(completion * 100)


class Scholarship(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    amount = db.Column(db.Float, nullable=False, index=True)
    deadline = db.Column(db.DateTime, nullable=False, index=True)
    requirements = db.Column(db.Text)
    eligibility_criteria = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True, index=True)
    max_applicants = db.Column(db.Integer)
    application_count = db.Column(db.Integer, default=0)
    
    # Relationships
    creator = db.relationship('User', backref='created_scholarships')
    applications = db.relationship('Application', backref='scholarship', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'amount': self.amount,
            'deadline': self.deadline.isoformat(),
            'requirements': self.requirements,
            'eligibility_criteria': self.eligibility_criteria,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'created_by': self.created_by,
            'is_active': self.is_active,
            'max_applicants': self.max_applicants,
            'application_count': self.application_count,
            'creator_name': self.creator.name if self.creator else None
        }
    
    def __repr__(self):
        return f'<Scholarship {self.title}>'


class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    scholarship_id = db.Column(db.Integer, db.ForeignKey('scholarship.id'), nullable=False, index=True)
    status = db.Column(db.String(20), default='pending', index=True)  # pending, under_review, approved, rejected
    essay = db.Column(db.Text)  # Personal statement or essay
    submission_date = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    reviewed_at = db.Column(db.DateTime, index=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    notes = db.Column(db.Text)  # Admin notes

    def __repr__(self):
        return f'<Application {self.id} - {self.status}>'

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'scholarship_id': self.scholarship_id,
            'status': self.status,
            'essay': self.essay,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'reviewed_by': self.reviewed_by,
            'notes': self.notes
        }