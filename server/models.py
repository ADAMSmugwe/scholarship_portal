from extensions import db, login_manager, bcrypt
from flask_login import UserMixin
from datetime import datetime

@login_manager.user_loader
def load_user(id):
    from extensions import db
    return db.session.query(User).get(int(id))

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')  # student, donor, admin
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    applications = db.relationship('Application', backref='applicant', lazy=True, foreign_keys='Application.student_id')
    reviewed_applications = db.relationship('Application', backref='reviewer', lazy=True, foreign_keys='Application.reviewed_by')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.email}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Scholarship(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    deadline = db.Column(db.DateTime, nullable=False)
    eligibility_criteria = db.Column(db.Text)
    contact_email = db.Column(db.String(120))
    website = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    applications = db.relationship('Application', backref='scholarship', lazy=True)

    def __repr__(self):
        return f'<Scholarship {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'amount': self.amount,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'eligibility_criteria': self.eligibility_criteria,
            'contact_email': self.contact_email,
            'website': self.website,
            'is_active': self.is_active,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    scholarship_id = db.Column(db.Integer, db.ForeignKey('scholarship.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, under_review, approved, rejected
    essay = db.Column(db.Text)  # Personal statement or essay
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('user.id'))
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