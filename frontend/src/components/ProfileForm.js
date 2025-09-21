import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Box,
  Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';

const ProfileForm = () => {
  const [profile, setProfile] = useState({
    date_of_birth: null,
    phone_number: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    current_school: '',
    major: '',
    gpa: '',
    graduation_year: '',
    education_level: '',
    bio: '',
    achievements: '',
    extracurricular_activities: ''
  });

  const [completion, setCompletion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/profile');
      if (response.data) {
        setProfile({
          ...response.data,
          date_of_birth: response.data.date_of_birth ? new Date(response.data.date_of_birth) : null
        });
        setCompletion(response.data.completion_percentage || 0);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setProfile(prev => ({
      ...prev,
      date_of_birth: date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(false);
      
      const formData = {
        ...profile,
        date_of_birth: profile.date_of_birth?.toISOString().split('T')[0],
        gpa: profile.gpa ? parseFloat(profile.gpa) : null,
        graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null
      };

      await axios.put('/api/profile', formData);
      setSuccess(true);
      fetchProfile(); // Refresh profile data to get updated completion percentage
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const fieldName = e.target.name;
    
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`/api/profile/upload/${fieldName}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProfile(prev => ({
        ...prev,
        [`${fieldName}_url`]: response.data.url
      }));
      setSuccess(true);
    } catch (err) {
      setError(`Failed to upload ${fieldName}`);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile Information
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated successfully
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" gutterBottom>
            Profile Completion
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={completion} 
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="caption" sx={{ mt: 1 }}>
            {completion}% Complete
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Personal Information Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date of Birth"
                  value={profile.date_of_birth}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  disableFuture
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone_number"
                value={profile.phone_number}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={profile.address}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={profile.city}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="State/Province"
                name="state"
                value={profile.state}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={profile.country}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postal_code"
                value={profile.postal_code}
                onChange={handleChange}
              />
            </Grid>

            {/* Academic Information Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Academic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current School"
                name="current_school"
                value={profile.current_school}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Major/Field of Study"
                name="major"
                value={profile.major}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GPA"
                name="gpa"
                type="number"
                inputProps={{ step: "0.01", min: "0", max: "4.0" }}
                value={profile.gpa}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expected Graduation Year"
                name="graduation_year"
                type="number"
                value={profile.graduation_year}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Education Level</InputLabel>
                <Select
                  name="education_level"
                  value={profile.education_level}
                  label="Education Level"
                  onChange={handleChange}
                >
                  <MenuItem value="high_school">High School</MenuItem>
                  <MenuItem value="undergraduate">Undergraduate</MenuItem>
                  <MenuItem value="graduate">Graduate</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Documents Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Documents
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                name="transcript"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="transcript-upload"
              />
              <label htmlFor="transcript-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                >
                  Upload Transcript
                </Button>
              </label>
              {profile.transcript_url && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Transcript uploaded
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                name="resume"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="resume-upload"
              />
              <label htmlFor="resume-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                >
                  Upload Resume
                </Button>
              </label>
              {profile.resume_url && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Resume uploaded
                </Typography>
              )}
            </Grid>

            {/* Additional Information Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Additional Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Bio"
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                helperText="Tell us about yourself"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Achievements"
                name="achievements"
                value={profile.achievements}
                onChange={handleChange}
                helperText="List your academic and personal achievements"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Extracurricular Activities"
                name="extracurricular_activities"
                value={profile.extracurricular_activities}
                onChange={handleChange}
                helperText="List your extracurricular activities and leadership roles"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
              >
                Save Profile
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ProfileForm;
