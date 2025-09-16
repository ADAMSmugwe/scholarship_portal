import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import { ArrowBack, CalendarToday, AttachMoney, School } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ScholarshipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchScholarship();
  }, [id]);

  const fetchScholarship = async () => {
    try {
      const response = await axios.get(`/api/scholarships/${id}`);
      setScholarship(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load scholarship details');
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setApplying(true);
    try {
      await axios.post('/api/applications', {
        scholarship_id: scholarship.id
      });
      alert('Application submitted successfully!');
    } catch (error) {
      alert('Failed to submit application: ' + (error.response?.data?.error || 'Unknown error'));
    }
    setApplying(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/scholarships')}>
          Back to Scholarships
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/scholarships')}
        sx={{ mb: 2 }}
      >
        Back to Scholarships
      </Button>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {scholarship.title}
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <AttachMoney sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" color="primary">
                  {formatCurrency(scholarship.amount)}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <CalendarToday sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">
                  Deadline: {formatDate(scholarship.deadline)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" paragraph>
            {scholarship.description}
          </Typography>

          {scholarship.eligibility_criteria && (
            <>
              <Typography variant="h6" gutterBottom>
                Eligibility Criteria
              </Typography>
              <Typography variant="body1" paragraph>
                {scholarship.eligibility_criteria}
              </Typography>
            </>
          )}

          {scholarship.contact_email && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Typography variant="body1">
                Email: {scholarship.contact_email}
              </Typography>
              {scholarship.website && (
                <Typography variant="body1">
                  Website: <a href={scholarship.website} target="_blank" rel="noopener noreferrer">
                    {scholarship.website}
                  </a>
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleApply}
              disabled={applying}
              startIcon={<School />}
            >
              {applying ? 'Submitting...' : 'Apply for Scholarship'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ScholarshipDetail;
