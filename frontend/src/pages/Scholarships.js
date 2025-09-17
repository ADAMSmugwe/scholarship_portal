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
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import axios from 'axios';

const Scholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    sortBy: 'deadline'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchScholarships();
  }, [searchTerm, filters, page]);

  const fetchScholarships = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: searchTerm,
        sort_by: filters.sortBy,
        page: page,
        per_page: 12
      });

      if (filters.minAmount) params.append('min_amount', filters.minAmount);
      if (filters.maxAmount) params.append('max_amount', filters.maxAmount);

      const response = await axios.get(`/api/search/scholarships?${params}`);
      setScholarships(response.data.scholarships);
      setTotalPages(response.data.pagination.total_pages);
      setLoading(false);
    } catch (error) {
      setError('Failed to load scholarships');
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (event, value) => {
    setPage(value);
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

  const isDeadlineSoon = (deadline) => {
    const today = new Date();
    const dueDate = new Date(deadline);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Scholarships
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Search scholarships"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              label="Min Amount"
              name="minAmount"
              type="number"
              value={filters.minAmount}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              label="Max Amount"
              name="maxAmount"
              type="number"
              value={filters.maxAmount}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                name="sortBy"
                value={filters.sortBy}
                label="Sort By"
                onChange={handleFilterChange}
              >
                <MenuItem value="deadline">Deadline</MenuItem>
                <MenuItem value="amount">Amount</MenuItem>
                <MenuItem value="title">Title</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Scholarships Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Showing {scholarships.length} scholarships
          </Typography>

          <Grid container spacing={3}>
            {scholarships.map((scholarship) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={scholarship.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography 
                      variant="h6" 
                      component={Link} 
                      to={`/scholarships/${scholarship.id}`}
                      gutterBottom
                      sx={{ 
                        textDecoration: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {scholarship.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {scholarship.description.length > 120
                        ? `${scholarship.description.substring(0, 120)}...`
                        : scholarship.description}
                    </Typography>

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(scholarship.amount)}
                      </Typography>
                      <Chip
                        label={`Due: ${formatDate(scholarship.deadline)}`}
                        size="small"
                        color={isDeadlineSoon(scholarship.deadline) ? "error" : "default"}
                      />
                    </Box>

                    {scholarship.eligibility_criteria && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Eligibility:</strong> {scholarship.eligibility_criteria.length > 80
                          ? `${scholarship.eligibility_criteria.substring(0, 80)}...`
                          : scholarship.eligibility_criteria}
                      </Typography>
                    )}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}

          {scholarships.length === 0 && (
            <Box textAlign="center" my={4}>
              <Typography variant="h6" color="text.secondary">
                No scholarships found matching your criteria.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Scholarships;
