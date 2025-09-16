import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { School, Search, Person, AdminPanelSettings } from '@mui/icons-material';
import axios from 'axios';

const Home = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    try {
      const response = await axios.get('/api/scholarships');
      // Show only first 3 scholarships on home page
      setScholarships(response.data.slice(0, 3));
      setLoading(false);
    } catch (error) {
      setError('Failed to load scholarships');
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
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Scholarship Portal
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Discover and apply for scholarships to fund your education
        </Typography>
        <Button
          variant="contained"
          size="large"
          component={Link}
          to="/scholarships"
          startIcon={<Search />}
        >
          Browse Scholarships
        </Button>
      </Box>

      {/* Features Section */}
      <Grid container spacing={4} mb={6}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <School sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                Browse Scholarships
              </Typography>
              <Typography color="text.secondary">
                Explore hundreds of scholarships available for students
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/scholarships">
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <Person sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                Easy Application
              </Typography>
              <Typography color="text.secondary">
                Simple and streamlined application process
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/register">
                Get Started
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <AdminPanelSettings sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom>
                Admin Dashboard
              </Typography>
              <Typography color="text.secondary">
                Manage scholarships and review applications
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/admin">
                Admin Panel
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Featured Scholarships */}
      <Typography variant="h4" component="h2" gutterBottom>
        Featured Scholarships
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {scholarships.map((scholarship) => (
            <Grid size={{ xs: 12, md: 4 }} key={scholarship.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {scholarship.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {scholarship.description.length > 100
                      ? `${scholarship.description.substring(0, 100)}...`
                      : scholarship.description}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(scholarship.amount)}
                    </Typography>
                    <Chip
                      label={`Due: ${formatDate(scholarship.deadline)}`}
                      size="small"
                      color="secondary"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to={`/scholarships/${scholarship.id}`}>
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {scholarships.length > 0 && (
        <Box textAlign="center" mt={4}>
          <Button variant="outlined" component={Link} to="/scholarships">
            View All Scholarships
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Home;
