import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import { Add, Edit, Delete, AttachMoney, People } from '@mui/icons-material';
import axios from 'axios';

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [scholarships, setScholarships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    deadline: '',
    eligibility_criteria: '',
    contact_email: '',
    website: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scholarshipsRes, applicationsRes] = await Promise.all([
        axios.get('/api/admin/scholarships'),
        axios.get('/api/admin/applications')
      ]);
      setScholarships(scholarshipsRes.data);
      setApplications(applicationsRes.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load admin data');
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDialogOpen = (scholarship = null) => {
    if (scholarship) {
      setEditingScholarship(scholarship);
      setFormData({
        title: scholarship.title,
        description: scholarship.description,
        amount: scholarship.amount,
        deadline: scholarship.deadline.split('T')[0], // Format for date input
        eligibility_criteria: scholarship.eligibility_criteria || '',
        contact_email: scholarship.contact_email || '',
        website: scholarship.website || ''
      });
    } else {
      setEditingScholarship(null);
      setFormData({
        title: '',
        description: '',
        amount: '',
        deadline: '',
        eligibility_criteria: '',
        contact_email: '',
        website: ''
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingScholarship(null);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingScholarship) {
        await axios.put(`/api/admin/scholarships/${editingScholarship.id}`, formData);
      } else {
        await axios.post('/api/admin/scholarships', formData);
      }
      handleDialogClose();
      fetchData();
    } catch (error) {
      alert('Failed to save scholarship: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const handleDeleteScholarship = async (id) => {
    if (window.confirm('Are you sure you want to delete this scholarship?')) {
      try {
        await axios.delete(`/api/admin/scholarships/${id}`);
        fetchData();
      } catch (error) {
        alert('Failed to delete scholarship');
      }
    }
  };

  const handleApplicationStatusChange = async (id, status) => {
    try {
      await axios.put(`/api/admin/applications/${id}`, { status });
      fetchData();
    } catch (error) {
      alert('Failed to update application status');
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
        Admin Dashboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Scholarships" />
          <Tab label="Applications" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Manage Scholarships ({scholarships.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleDialogOpen()}
            >
              Add Scholarship
            </Button>
          </Box>

          <Grid container spacing={3}>
            {scholarships.map((scholarship) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={scholarship.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {scholarship.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {scholarship.description.length > 100
                        ? `${scholarship.description.substring(0, 100)}...`
                        : scholarship.description}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(scholarship.amount)}
                      </Typography>
                      <Typography variant="body2">
                        Due: {formatDate(scholarship.deadline)}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleDialogOpen(scholarship)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteScholarship(scholarship.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Review Applications ({applications.length})
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Applicant</TableCell>
                  <TableCell>Scholarship</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Applied Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      {application.user.first_name} {application.user.last_name}
                      <br />
                      <Typography variant="body2" color="text.secondary">
                        {application.user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{application.scholarship.title}</TableCell>
                    <TableCell>{formatCurrency(application.scholarship.amount)}</TableCell>
                    <TableCell>{formatDate(application.created_at)}</TableCell>
                    <TableCell>
                      <Chip
                        label={application.status}
                        color={getStatusColor(application.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {application.status === 'pending' && (
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleApplicationStatusChange(application.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleApplicationStatusChange(application.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Scholarship Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Eligibility Criteria"
                  name="eligibility_criteria"
                  value={formData.eligibility_criteria}
                  onChange={handleFormChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  name="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleFormChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingScholarship ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
