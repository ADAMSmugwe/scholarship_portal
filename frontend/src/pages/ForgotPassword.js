import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('request'); // 'request' or 'reset'
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      await requestPasswordReset(email);
      setMessage('If an account exists with this email, you will receive a password reset link.');
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await resetPassword(resetToken, newPassword);
      setMessage('Password successfully reset! You can now login with your new password.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            {step === 'request' ? 'Forgot Password' : 'Reset Password'}
          </Typography>

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {step === 'request' ? (
            <Box component="form" onSubmit={handleRequestReset} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Send Reset Link
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleResetPassword} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="resetToken"
                label="Reset Token"
                name="resetToken"
                autoFocus
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="New Password"
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Reset Password
              </Button>
            </Box>
          )}
          
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/login')}
            sx={{ mt: 1 }}
          >
            Back to Login
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
