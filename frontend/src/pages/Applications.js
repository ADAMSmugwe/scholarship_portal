import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Button
} from '@mui/material';
import { CalendarToday, AttachMoney, School } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get('/api/applications/my-applications');
      setApplications(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load applications');
      setLoading(false);
    }
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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Applications
      </Typography>

      {applications.length === 0 ? (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="text.secondary">
            You haven't applied for any scholarships yet.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            href="/scholarships"
          >
            Browse Scholarships
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {applications.map((application) => (
            <Grid size={{ xs: 12, md: 6 }} key={application.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {application.scholarship.title}
                  </Typography>

                  <Box display="flex" alignItems="center" mb={2}>
                    <AttachMoney sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" color="primary">
                      {formatCurrency(application.scholarship.amount)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={2}>
                    <CalendarToday sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant="body2">
                      Applied on: {formatDate(application.created_at)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={2}>
                    <School sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      Deadline: {formatDate(application.scholarship.deadline)}
                    </Typography>
                  </Box>

                  <Chip
                    label={application.status}
                    color={getStatusColor(application.status)}
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Applications;
