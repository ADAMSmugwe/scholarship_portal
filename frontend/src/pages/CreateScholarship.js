import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ScholarshipForm from '../components/ScholarshipForm';

const CreateScholarship = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create Scholarship
        </Typography>
        <ScholarshipForm mode="create" />
      </Box>
    </Container>
  );
};

export default CreateScholarship;
