import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  InputAdornment,
  OutlinedInput,
  FormHelperText,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ScholarshipForm = ({ scholarship, mode = 'create' }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: scholarship?.title || '',
    description: scholarship?.description || '',
    amount: scholarship?.amount || '',
    deadline: scholarship?.deadline ? new Date(scholarship.deadline) : null,
    requirements: scholarship?.requirements || '',
    eligibility_criteria: scholarship?.eligibility_criteria || '',
    max_applicants: scholarship?.max_applicants || ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      deadline: date
    }));
  };

  const validateForm = () => {
    if (!formData.title) return 'Title is required';
    if (!formData.description) return 'Description is required';
    if (!formData.amount || formData.amount <= 0) return 'Valid amount is required';
    if (!formData.deadline) return 'Deadline is required';
    if (new Date(formData.deadline) < new Date()) return 'Deadline must be in the future';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = {
        ...formData,
        deadline: formData.deadline.toISOString(),
        amount: parseFloat(formData.amount),
        max_applicants: formData.max_applicants ? parseInt(formData.max_applicants) : null
      };

      if (mode === 'create') {
        await axios.post('/api/scholarships', data);
      } else {
        await axios.put(`/api/scholarships/${scholarship.id}`, data);
      }

      navigate('/scholarships');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save scholarship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        {mode === 'create' ? 'Create New Scholarship' : 'Edit Scholarship'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              multiline
              rows={4}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Amount</InputLabel>
              <OutlinedInput
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                startAdornment={<InputAdornment position="start">$</InputAdornment>}
                label="Amount"
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Deadline"
                value={formData.deadline}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth required />}
                disablePast
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              helperText="List any specific requirements for applicants"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Eligibility Criteria"
              name="eligibility_criteria"
              value={formData.eligibility_criteria}
              onChange={handleChange}
              helperText="Specify who is eligible to apply"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Maximum Applicants"
              name="max_applicants"
              value={formData.max_applicants}
              onChange={handleChange}
              helperText="Leave blank for no limit"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/scholarships')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : mode === 'create' ? 'Create Scholarship' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ScholarshipForm;
