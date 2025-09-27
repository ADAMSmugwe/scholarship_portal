import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondary,
  IconButton,
  Alert
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';

const FileUpload = ({ onUploadSuccess, fileType, maxSize = 10 * 1024 * 1024 }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const { getAuthHeaders } = useAuth();

  const onDrop = useCallback(acceptedFiles => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize,
    maxFiles: 1
  });

  const handleUpload = async (file) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', fileType);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        headers: {
          ...getAuthHeaders()
          // Note: Don't set Content-Type here, let the browser set it with the boundary
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Remove the uploaded file from the list
      setFiles(prevFiles => prevFiles.filter(f => f !== file));
      
      if (onUploadSuccess) {
        onUploadSuccess(data.document);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileToRemove) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ width: '100%', my: 2 }}>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 1,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography>
          {isDragActive
            ? 'Drop the file here'
            : 'Drag & drop a file here, or click to select'}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Accepted files: PDF, DOC, DOCX, JPG, PNG (Max size: {formatFileSize(maxSize)})
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <List>
        {files.map((file, index) => (
          <ListItem
            key={index}
            secondaryAction={
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={() => removeFile(file)}
                disabled={uploading}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={file.name}
              secondary={formatFileSize(file.size)}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleUpload(file)}
              disabled={uploading}
              sx={{ ml: 2 }}
            >
              {uploading ? <CircularProgress size={24} /> : 'Upload'}
            </Button>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default FileUpload;
