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

// Create a singleton axios instance for email verification
const verificationApi = axios.create({
  baseURL: 'http://localhost:5003',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || hasAttempted) {
        return;
      }

      try {
        setHasAttempted(true);
        const response = await verificationApi.get(`/api/auth/verify-email/${token}`);

        if (response.data.message) {
          setStatus('success');
          setMessage(response.data.message);
        } else {
          throw new Error('Invalid server response');
        }
      } catch (error) {
        setStatus('error');
        if (error.response?.data?.error) {
          setMessage(error.response.data.error);
        } else if (error.message === 'Network Error') {
          setMessage('Unable to connect to the server. Please try again later.');
        } else {
          setMessage('An error occurred during email verification.');
        }
        console.error('Verification error:', error);
      }
    };

    verifyEmail();
  }, [token, hasAttempted]);

  const handleContinue = () => {
    navigate('/login');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Email Verification
          </Typography>

          {status === 'verifying' && (
            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>
                Verifying your email address...
              </Typography>
            </Box>
          )}

          {status === 'success' && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                {message}
              </Alert>
              <Button
                variant="contained"
                color="primary"
                onClick={handleContinue}
                fullWidth
              >
                Continue to Login
              </Button>
            </Box>
          )}

          {status === 'error' && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {message}
              </Alert>
              <Button
                variant="contained"
                color="primary"
                onClick={handleContinue}
                fullWidth
              >
                Go to Login
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerification;
