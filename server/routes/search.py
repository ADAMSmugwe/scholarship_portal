from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from extensions import db
from models import Scholarship, Application
from sqlalchemy import or_, and_
from datetime import datetime

search_bp = Blueprint('search', __name__)

@search_bp.route('/scholarships', methods=['GET'], strict_slashes=False)
def search_scholarships():
    """Search and filter scholarships"""
    # Get query parameters
    query = request.args.get('q', '')
    min_amount = request.args.get('min_amount', type=float)
    max_amount = request.args.get('max_amount', type=float)
    deadline_before = request.args.get('deadline_before')
    deadline_after = request.args.get('deadline_after')
    sort_by = request.args.get('sort_by', 'deadline')  # deadline, amount, title
    sort_order = request.args.get('sort_order', 'asc')  # asc, desc
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Build query
    scholarships_query = Scholarship.query.filter_by(is_active=True)

    # Text search
    if query:
        scholarships_query = scholarships_query.filter(
            or_(
                Scholarship.title.ilike(f'%{query}%'),
                Scholarship.description.ilike(f'%{query}%'),
                Scholarship.eligibility_criteria.ilike(f'%{query}%')
            )
        )

    # Amount filters
    if min_amount is not None:
        scholarships_query = scholarships_query.filter(Scholarship.amount >= min_amount)
    if max_amount is not None:
        scholarships_query = scholarships_query.filter(Scholarship.amount <= max_amount)

    # Deadline filters
    if deadline_before:
        try:
            deadline_before_date = datetime.fromisoformat(deadline_before)
            scholarships_query = scholarships_query.filter(Scholarship.deadline <= deadline_before_date)
        except ValueError:
            return jsonify({'error': 'Invalid deadline_before format. Use ISO format.'}), 400

    if deadline_after:
        try:
            deadline_after_date = datetime.fromisoformat(deadline_after)
            scholarships_query = scholarships_query.filter(Scholarship.deadline >= deadline_after_date)
        except ValueError:
            return jsonify({'error': 'Invalid deadline_after format. Use ISO format.'}), 400

    # Sorting
    if sort_by == 'amount':
        order_column = Scholarship.amount
    elif sort_by == 'title':
        order_column = Scholarship.title
    else:  # default to deadline
        order_column = Scholarship.deadline

    if sort_order == 'desc':
        scholarships_query = scholarships_query.order_by(order_column.desc())
    else:
        scholarships_query = scholarships_query.order_by(order_column.asc())

    # Pagination
    scholarships = scholarships_query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'scholarships': [s.to_dict() for s in scholarships.items],
        'pagination': {
            'page': scholarships.page,
            'per_page': scholarships.per_page,
            'total': scholarships.total,
            'pages': scholarships.pages,
            'has_next': scholarships.has_next,
            'has_prev': scholarships.has_prev
        }
    })

@search_bp.route('/applications', methods=['GET'])
@login_required
def search_applications():
    """Search user's applications"""
    status = request.args.get('status')
    scholarship_title = request.args.get('scholarship_title')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # Build query for user's applications
    applications_query = Application.query.filter_by(student_id=current_user.id)

    # Status filter
    if status:
        applications_query = applications_query.filter_by(status=status)

    # Scholarship title filter (join with scholarship table)
    if scholarship_title:
        applications_query = applications_query.join(Scholarship).filter(
            Scholarship.title.ilike(f'%{scholarship_title}%')
        )

    # Order by submission date (newest first)
    applications_query = applications_query.order_by(Application.submission_date.desc())

    # Pagination
    applications = applications_query.paginate(page=page, per_page=per_page, error_out=False)

    # Include scholarship details in response
    result = []
    for app in applications.items:
        app_dict = app.to_dict()
        app_dict['scholarship'] = {
            'id': app.scholarship.id,
            'title': app.scholarship.title,
            'amount': app.scholarship.amount,
            'deadline': app.scholarship.deadline.isoformat() if app.scholarship.deadline else None
        }
        result.append(app_dict)

    return jsonify({
        'applications': result,
        'pagination': {
            'page': applications.page,
            'per_page': applications.per_page,
            'total': applications.total,
            'pages': applications.pages,
            'has_next': applications.has_next,
            'has_prev': applications.has_prev
        }
    })
