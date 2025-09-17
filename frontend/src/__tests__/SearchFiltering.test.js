import React from 'react';
import { render, screen, waitFor } from '../test-utils';
import userEvent from '../test-utils';
import { mockedAxios } from '../test-utils';
import App from '../App';

// Mock axios
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    defaults: {
      baseURL: 'http://127.0.0.1:5002',
      headers: {
        common: {}
      }
    },
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

describe('Search and Filtering Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('user can search scholarships by title', async () => {
    

    // Mock authenticated user and scholarships
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/profile/') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'student'
          }
        });
      }
      if (url === '/api/scholarships') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'STEM Scholarship',
              description: 'For STEM students',
              amount: 5000,
              deadline: '2024-12-31T00:00:00'
            },
            {
              id: 2,
              title: 'Arts Scholarship',
              description: 'For arts students',
              amount: 3000,
              deadline: '2024-11-30T00:00:00'
            },
            {
              id: 3,
              title: 'STEM Research Grant',
              description: 'For research projects',
              amount: 10000,
              deadline: '2024-10-31T00:00:00'
            }
          ]
        });
      }
      if (url === '/api/scholarships/search?q=STEM') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'STEM Scholarship',
              description: 'For STEM students',
              amount: 5000,
              deadline: '2024-12-31T00:00:00'
            },
            {
              id: 3,
              title: 'STEM Research Grant',
              description: 'For research projects',
              amount: 10000,
              deadline: '2024-10-31T00:00:00'
            }
          ]
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to scholarships
    const scholarshipsLink = screen.getByRole('link', { name: /scholarships/i });
    await user.click(scholarshipsLink);

    // Verify all scholarships are displayed initially
    await waitFor(() => {
      expect(screen.getByText('STEM Scholarship')).toBeInTheDocument();
      expect(screen.getByText('Arts Scholarship')).toBeInTheDocument();
      expect(screen.getByText('STEM Research Grant')).toBeInTheDocument();
    });

    // Search for STEM scholarships
    const searchInput = screen.getByPlaceholderText(/search scholarships/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'STEM');
    await user.click(searchButton);

    // Verify only STEM scholarships are displayed
    await waitFor(() => {
      expect(screen.getByText('STEM Scholarship')).toBeInTheDocument();
      expect(screen.getByText('STEM Research Grant')).toBeInTheDocument();
      expect(screen.queryByText('Arts Scholarship')).not.toBeInTheDocument();
    });
  });

  test('user can filter scholarships by amount range', async () => {
    

    // Mock authenticated user and scholarships
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/profile/') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'student'
          }
        });
      }
      if (url === '/api/scholarships') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Small Scholarship',
              description: 'Small amount',
              amount: 1000,
              deadline: '2024-12-31T00:00:00'
            },
            {
              id: 2,
              title: 'Medium Scholarship',
              description: 'Medium amount',
              amount: 5000,
              deadline: '2024-11-30T00:00:00'
            },
            {
              id: 3,
              title: 'Large Scholarship',
              description: 'Large amount',
              amount: 15000,
              deadline: '2024-10-31T00:00:00'
            }
          ]
        });
      }
      if (url === '/api/scholarships/search?min_amount=3000&max_amount=10000') {
        return Promise.resolve({
          data: [
            {
              id: 2,
              title: 'Medium Scholarship',
              description: 'Medium amount',
              amount: 5000,
              deadline: '2024-11-30T00:00:00'
            }
          ]
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to scholarships
    const scholarshipsLink = screen.getByRole('link', { name: /scholarships/i });
    await user.click(scholarshipsLink);

    // Wait for scholarships to load
    await waitFor(() => {
      expect(screen.getByText('Small Scholarship')).toBeInTheDocument();
    });

    // Apply amount filter
    const minAmountInput = screen.getByLabelText(/minimum amount/i);
    const maxAmountInput = screen.getByLabelText(/maximum amount/i);
    const filterButton = screen.getByRole('button', { name: /filter/i });

    await user.type(minAmountInput, '3000');
    await user.type(maxAmountInput, '10000');
    await user.click(filterButton);

    // Verify only filtered scholarships are displayed
    await waitFor(() => {
      expect(screen.getByText('Medium Scholarship')).toBeInTheDocument();
      expect(screen.queryByText('Small Scholarship')).not.toBeInTheDocument();
      expect(screen.queryByText('Large Scholarship')).not.toBeInTheDocument();
    });
  });

  test('user can filter scholarships by deadline', async () => {
    

    // Mock authenticated user and scholarships
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/profile/') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'student'
          }
        });
      }
      if (url === '/api/scholarships') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Early Deadline',
              description: 'Early deadline',
              amount: 5000,
              deadline: '2024-06-30T00:00:00'
            },
            {
              id: 2,
              title: 'Late Deadline',
              description: 'Late deadline',
              amount: 5000,
              deadline: '2024-12-31T00:00:00'
            }
          ]
        });
      }
      if (url === '/api/scholarships/search?deadline_before=2024-10-01') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Early Deadline',
              description: 'Early deadline',
              amount: 5000,
              deadline: '2024-06-30T00:00:00'
            }
          ]
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to scholarships
    const scholarshipsLink = screen.getByRole('link', { name: /scholarships/i });
    await user.click(scholarshipsLink);

    // Wait for scholarships to load
    await waitFor(() => {
      expect(screen.getByText('Early Deadline')).toBeInTheDocument();
    });

    // Apply deadline filter
    const deadlineInput = screen.getByLabelText(/deadline before/i);
    const filterButton = screen.getByRole('button', { name: /filter/i });

    await user.type(deadlineInput, '2024-10-01');
    await user.click(filterButton);

    // Verify only filtered scholarships are displayed
    await waitFor(() => {
      expect(screen.getByText('Early Deadline')).toBeInTheDocument();
      expect(screen.queryByText('Late Deadline')).not.toBeInTheDocument();
    });
  });

  test('search results are paginated', async () => {
    

    // Mock authenticated user and paginated scholarships
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/profile/') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'student'
          }
        });
      }
      if (url === '/api/scholarships/search?q=test&page=1&per_page=10') {
        return Promise.resolve({
          data: [
            // First 10 results
            ...Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              title: `Test Scholarship ${i + 1}`,
              description: `Description ${i + 1}`,
              amount: 5000,
              deadline: '2024-12-31T00:00:00'
            }))
          ],
          total: 25,
          page: 1,
          per_page: 10
        });
      }
      if (url === '/api/scholarships/search?q=test&page=2&per_page=10') {
        return Promise.resolve({
          data: [
            // Next 10 results
            ...Array.from({ length: 10 }, (_, i) => ({
              id: i + 11,
              title: `Test Scholarship ${i + 11}`,
              description: `Description ${i + 11}`,
              amount: 5000,
              deadline: '2024-12-31T00:00:00'
            }))
          ],
          total: 25,
          page: 2,
          per_page: 10
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to scholarships
    const scholarshipsLink = screen.getByRole('link', { name: /scholarships/i });
    await user.click(scholarshipsLink);

    // Search for scholarships
    const searchInput = screen.getByPlaceholderText(/search scholarships/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'test');
    await user.click(searchButton);

    // Verify first page results
    await waitFor(() => {
      expect(screen.getByText('Test Scholarship 1')).toBeInTheDocument();
      expect(screen.getByText('Test Scholarship 10')).toBeInTheDocument();
    });

    // Navigate to next page
    const nextPageButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextPageButton);

    // Verify second page results
    await waitFor(() => {
      expect(screen.getByText('Test Scholarship 11')).toBeInTheDocument();
      expect(screen.getByText('Test Scholarship 20')).toBeInTheDocument();
    });
  });

  test('empty search results are handled gracefully', async () => {
    

    // Mock authenticated user and empty search results
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/profile/') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'student'
          }
        });
      }
      if (url === '/api/scholarships/search?q=nonexistent') {
        return Promise.resolve({
          data: [],
          total: 0
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to scholarships
    const scholarshipsLink = screen.getByRole('link', { name: /scholarships/i });
    await user.click(scholarshipsLink);

    // Search for non-existent scholarships
    const searchInput = screen.getByPlaceholderText(/search scholarships/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'nonexistent');
    await user.click(searchButton);

    // Verify empty state message
    await waitFor(() => {
      expect(screen.getByText(/no scholarships found/i)).toBeInTheDocument();
    });
  });

  test('search with multiple filters works correctly', async () => {
    

    // Mock authenticated user and filtered scholarships
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/profile/') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'student'
          }
        });
      }
      if (url === '/api/scholarships/search?q=STEM&min_amount=5000&max_amount=15000&deadline_before=2024-12-01') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'STEM Advanced Scholarship',
              description: 'For advanced STEM students',
              amount: 10000,
              deadline: '2024-11-30T00:00:00'
            }
          ]
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to scholarships
    const scholarshipsLink = screen.getByRole('link', { name: /scholarships/i });
    await user.click(scholarshipsLink);

    // Apply multiple filters
    const searchInput = screen.getByPlaceholderText(/search scholarships/i);
    const minAmountInput = screen.getByLabelText(/minimum amount/i);
    const maxAmountInput = screen.getByLabelText(/maximum amount/i);
    const deadlineInput = screen.getByLabelText(/deadline before/i);
    const filterButton = screen.getByRole('button', { name: /filter/i });

    await user.type(searchInput, 'STEM');
    await user.type(minAmountInput, '5000');
    await user.type(maxAmountInput, '15000');
    await user.type(deadlineInput, '2024-12-01');
    await user.click(filterButton);

    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText('STEM Advanced Scholarship')).toBeInTheDocument();
    });
  });

  test('clear filters resets search results', async () => {
    

    // Mock authenticated user and scholarships
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/profile/') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'student'
          }
        });
      }
      if (url === '/api/scholarships') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'STEM Scholarship',
              description: 'For STEM students',
              amount: 5000,
              deadline: '2024-12-31T00:00:00'
            },
            {
              id: 2,
              title: 'Arts Scholarship',
              description: 'For arts students',
              amount: 3000,
              deadline: '2024-11-30T00:00:00'
            }
          ]
        });
      }
      if (url === '/api/scholarships/search?q=STEM') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'STEM Scholarship',
              description: 'For STEM students',
              amount: 5000,
              deadline: '2024-12-31T00:00:00'
            }
          ]
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to scholarships
    const scholarshipsLink = screen.getByRole('link', { name: /scholarships/i });
    await user.click(scholarshipsLink);

    // Apply search filter
    const searchInput = screen.getByPlaceholderText(/search scholarships/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'STEM');
    await user.click(searchButton);

    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText('STEM Scholarship')).toBeInTheDocument();
      expect(screen.queryByText('Arts Scholarship')).not.toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    // Verify all scholarships are displayed again
    await waitFor(() => {
      expect(screen.getByText('STEM Scholarship')).toBeInTheDocument();
      expect(screen.getByText('Arts Scholarship')).toBeInTheDocument();
    });
  });
});
