from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, cache
from models import Scholarship
from datetime import datetime
from sqlalchemy.sql import select

scholarships_bp = Blueprint('scholarships', __name__)

@scholarships_bp.route('/', methods=['GET'], strict_slashes=False)
def get_scholarships():
    try:
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 10
        
        # Get total count for pagination metadata
        total_scholarships = Scholarship.query.filter_by(is_active=True).count()
        
        # Apply pagination to query
        scholarships_query = Scholarship.query.filter_by(is_active=True).order_by(Scholarship.deadline)
        scholarships = scholarships_query.offset((page - 1) * per_page).limit(per_page).all()
        
        # Calculate pagination metadata
        total_pages = (total_scholarships + per_page - 1) // per_page
        
        result = {
            'scholarships': [{
                'id': s.id,
                'title': s.title,
                'description': s.description,
                'amount': s.amount,
                'deadline': s.deadline.isoformat() if s.deadline else None,
                'created_at': s.created_at.isoformat() if s.created_at else None
            } for s in scholarships],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_scholarships': total_scholarships,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1,
                'next_page': page + 1 if page < total_pages else None,
                'prev_page': page - 1 if page > 1 else None
            }
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch scholarships'}), 500

@scholarships_bp.route('/<int:id>', methods=['GET'])
@cache.cached(timeout=600, key_prefix=lambda: f'scholarship_{request.view_args["id"]}')  # Cache for 10 minutes
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
@jwt_required()
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
        
        # Get current user
        user_id = get_jwt_identity()
        from models import User
        user = db.session.query(User).get(int(user_id))
        if user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        scholarship = Scholarship(
            title=data['title'],
            description=data['description'],
            amount=amount,
            deadline=deadline,
            created_by=int(user_id)
        )
        db.session.add(scholarship)
        db.session.commit()
        
        # Clear scholarships list cache
        cache.delete('scholarships_list')
        
        return jsonify({
            'id': scholarship.id,
            'message': 'Scholarship created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create scholarship'}), 500