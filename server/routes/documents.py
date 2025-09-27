import os
import mimetypes
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import Document, db

documents = Blueprint('documents', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file(file):
    # Check if file exists
    if not file:
        return False, "No file provided"
    
    # Check filename
    if not allowed_file(file.filename):
        return False, "File type not allowed"
    
    # Check file size
    if len(file.read()) > MAX_FILE_SIZE:
        file.seek(0)  # Reset file pointer
        return False, "File size exceeds maximum limit (10MB)"
    
    file.seek(0)  # Reset file pointer
    return True, None

@documents.route('/api/documents/upload', methods=['POST'])
@login_required
def upload_document():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    file_type = request.form.get('type', 'other')  # document type (e.g., transcript, resume)
    
    # Validate file
    is_valid, error = validate_file(file)
    if not is_valid:
        return jsonify({'error': error}), 400
    
    try:
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], str(current_user.id))
        os.makedirs(upload_dir, exist_ok=True)
        
        # Secure the filename and save the file
        filename = secure_filename(file.filename)
        file_path = os.path.join(upload_dir, filename)
        
        # Save the file
        file.save(file_path)
        
        # Get MIME type
        mime_type, _ = mimetypes.guess_type(file_path)
        
        # Create document record
        document = Document(
            user_id=current_user.id,
            filename=filename,
            file_path=file_path,
            file_type=file_type,
            mime_type=mime_type,
            size=os.path.getsize(file_path)
        )
        
        db.session.add(document)
        db.session.commit()
        
        return jsonify({
            'message': 'File uploaded successfully',
            'document': document.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@documents.route('/api/documents', methods=['GET'])
@login_required
def get_documents():
    documents = Document.query.filter_by(user_id=current_user.id).all()
    return jsonify({
        'documents': [doc.to_dict() for doc in documents]
    }), 200

@documents.route('/api/documents/<int:document_id>', methods=['DELETE'])
@login_required
def delete_document(document_id):
    document = Document.query.get_or_404(document_id)
    
    # Check ownership
    if document.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        # Delete file from filesystem
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Delete database record
        db.session.delete(document)
        db.session.commit()
        
        return jsonify({'message': 'Document deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
