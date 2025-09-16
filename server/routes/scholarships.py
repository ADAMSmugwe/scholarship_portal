from flask import Blueprint, request, jsonify
from flask_login import login_required
from extensions import db
from models import Scholarship
from datetime import datetime
from sqlalchemy.sql import select

scholarships_bp = Blueprint('scholarships', __name__)

@scholarships_bp.route('/', methods=['GET'])
def get_scholarships():
    try:
        scholarships = Scholarship.query.order_by(Scholarship.deadline).all()
        return jsonify([{
            'id': s.id,
            'title': s.title,
            'description': s.description,
            'amount': s.amount,
            'deadline': s.deadline.isoformat()
        } for s in scholarships])
    except Exception as e:
        return jsonify({'error': 'Failed to fetch scholarships'}), 500

@scholarships_bp.route('/<int:id>', methods=['GET'])
def get_scholarship(id):
    scholarship = Scholarship.query.get_or_404(id)
    return jsonify({
        'id': scholarship.id,
        'title': scholarship.title,
        'description': scholarship.description,
        'amount': scholarship.amount,
        'deadline': scholarship.deadline.isoformat()
    })

@scholarships_bp.route('/', methods=['POST'])
@login_required
def create_scholarship():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'amount', 'deadline']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate amount is positive
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({'error': 'Amount must be positive'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid amount format'}), 400
        
        # Validate deadline is in the future
        try:
            deadline = datetime.fromisoformat(data['deadline'])
            if deadline < datetime.now():
                return jsonify({'error': 'Deadline must be in the future'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid deadline format'}), 400
        
        scholarship = Scholarship(
            title=data['title'],
            description=data['description'],
            amount=amount,
            deadline=deadline
        )
        db.session.add(scholarship)
        db.session.commit()
        
        return jsonify({
            'id': scholarship.id,
            'message': 'Scholarship created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create scholarship'}), 500