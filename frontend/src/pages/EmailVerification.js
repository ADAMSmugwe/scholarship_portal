import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          setStatus('error');
          setMessage('No verification token provided');
          return;
        }

        console.log('Attempting to verify token:', token);
        
        // Configure axios for this request
        const instance = axios.create({
          baseURL: 'http://localhost:5003',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        const response = await instance.get(`/api/auth/verify-email/${token}`);
        console.log('Verification response:', response);
        
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        console.error('Verification error details:', {
          error: error,
          response: error.response,
          data: error.response?.data,
          status: error.response?.status
        });
        
        setStatus('error');
        if (error.response?.data?.error) {
          setMessage(error.response.data.error);
        } else if (error.response?.status === 400) {
          setMessage('Invalid or expired verification token');
        } else if (error.response?.status === 404) {
          setMessage('Verification endpoint not found');
        } else if (error.message === 'Network Error') {
          setMessage('Cannot connect to server. Please try again later.');
        } else {
          setMessage('An unexpected error occurred during verification');
        }
      }
    };

    verifyEmail();
  }, [token]);

  const handleContinue = () => {
    navigate('/login');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%', textAlign: 'center' }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Email Verification
          </Typography>

          {status === 'verifying' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>
                Verifying your email address...
              </Typography>
            </Box>
          )}

          {status === 'success' && (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                {message}
              </Alert>
              <Button
                variant="contained"
                color="primary"
                onClick={handleContinue}
                sx={{ mt: 2 }}
              >
                Continue to Login
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {message}
              </Alert>
              <Button
                variant="outlined"
                onClick={handleContinue}
                sx={{ mt: 2 }}
              >
                Back to Login
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerification;
