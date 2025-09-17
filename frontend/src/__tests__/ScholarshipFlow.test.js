import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const mockedAxios = require('axios').default;

describe('Scholarship Application Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('user can browse scholarships and view details', async () => {
    const user = userEvent;

    // Mock scholarships data
    const mockScholarships = [
      {
        id: 1,
        title: 'Test Scholarship 1',
        description: 'A test scholarship for students',
        amount: 5000,
        deadline: '2024-12-31T00:00:00'
      },
      {
        id: 2,
        title: 'Test Scholarship 2',
        description: 'Another test scholarship',
        amount: 3000,
        deadline: '2024-11-30T00:00:00'
      }
    ];

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/search/scholarships')) {
        return Promise.resolve({ 
          data: { 
            scholarships: mockScholarships, 
            pagination: { pages: 1, total: 2, page: 1, per_page: 12, has_next: false, has_prev: false } 
          } 
        });
      }
      if (url === '/api/scholarships/1') {
        return Promise.resolve({
          data: {
            id: 1,
            title: 'Test Scholarship 1',
            description: 'A test scholarship for students',
            amount: 5000,
            deadline: '2024-12-31T00:00:00',
            eligibility_criteria: 'Good academic standing'
          }
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    await act(async () => { render(<App />); });

    // Navigate to scholarships page
    const scholarshipsLink = screen.getByRole('link', { name: /browse scholarships/i });
    await user.click(scholarshipsLink);

    // Should load and display scholarships
    await waitFor(() => {
      expect(screen.getByText('Test Scholarship 1')).toBeInTheDocument();
      expect(screen.getByText('Test Scholarship 2')).toBeInTheDocument();
    });

    // Click on a scholarship to view details
    const scholarshipCard = screen.getByText('Test Scholarship 1');
    await user.click(scholarshipCard);

    // Should navigate to scholarship detail page
    await waitFor(() => {
      expect(screen.getByText('A test scholarship for students')).toBeInTheDocument();
      expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    });

    // Verify API calls
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/scholarships');
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/scholarships/1');
  });

  test('authenticated user can submit scholarship application', async () => {
    const user = userEvent;

    // Mock authenticated user
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
      if (url.includes('/api/search/scholarships')) {
        return Promise.resolve({ 
          data: { 
            scholarships: [{
              id: 1,
              title: 'Test Scholarship',
              description: 'A test scholarship',
              amount: 5000,
              deadline: '2024-12-31T00:00:00'
            }], 
            pagination: { pages: 1, total: 1, page: 1, per_page: 12, has_next: false, has_prev: false } 
          } 
        });
      }
      if (url === '/api/scholarships/1') {
        return Promise.resolve({
          data: {
            id: 1,
            title: 'Test Scholarship',
            description: 'A test scholarship',
            amount: 5000,
            deadline: '2024-12-31T00:00:00'
          }
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    mockedAxios.post.mockResolvedValue({
      data: { id: 1, message: 'Application submitted successfully' }
    });

    localStorage.setItem('token', 'mock-jwt-token');

    await act(async () => { render(<App />); });

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to scholarship detail
    const scholarshipsLink = screen.getByRole('link', { name: 'Scholarships' });
    await user.click(scholarshipsLink);

    // Click on scholarship
    await waitFor(() => {
      const scholarshipCard = screen.getByText('Test Scholarship');
      user.click(scholarshipCard);
    });

    // Should be on scholarship detail page
    await waitFor(() => {
      expect(screen.getByText('A test scholarship')).toBeInTheDocument();
    });

    // Click apply button
    const applyButton = screen.getByRole('button', { name: /apply for scholarship/i });
    await user.click(applyButton);

    // Should submit application
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/applications', {
        scholarship_id: 1
      });
    });
  });

  test('user can view their applications', async () => {
    const user = userEvent;

    // Mock authenticated user and applications
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
      if (url === '/api/applications/my-applications') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              scholarship: {
                id: 1,
                title: 'Test Scholarship',
                amount: 5000
              },
              status: 'pending',
              submitted_at: '2024-01-15T00:00:00'
            }
          ]
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    localStorage.setItem('token', 'mock-jwt-token');

    await act(async () => { render(<App />); });

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to applications
    const applicationsLink = screen.getByRole('link', { name: /applications/i });
    await user.click(applicationsLink);

    // Should load and display applications
    await waitFor(() => {
      expect(screen.getByText('Test Scholarship')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    // Verify API call
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/applications/my-applications');
  });

  test('admin can view all applications in dashboard', async () => {
    const user = userEvent;

    // Mock admin user and applications
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/profile/') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin'
          }
        });
      }
      if (url === '/api/admin/scholarships') {
        return Promise.resolve({
          data: [
            { id: 1, title: 'Scholarship 1', description: 'Desc 1', amount: 1000, deadline: '2024-12-31' },
            { id: 2, title: 'Scholarship 2', description: 'Desc 2', amount: 2000, deadline: '2024-12-31' }
          ]
        });
      }
      if (url === '/api/admin/applications') {
        return Promise.resolve({
          data: [
            { 
              id: 1, 
              user: { first_name: 'Student', last_name: 'One', email: 'student1@example.com' }, 
              scholarship: { title: 'Scholarship 1', amount: 1000 }, 
              status: 'pending',
              created_at: '2024-01-15T00:00:00'
            },
            { 
              id: 2, 
              user: { first_name: 'Student', last_name: 'Two', email: 'student2@example.com' }, 
              scholarship: { title: 'Scholarship 2', amount: 2000 }, 
              status: 'approved',
              created_at: '2024-01-14T00:00:00'
            }
          ]
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    localStorage.setItem('token', 'mock-jwt-token');

    await act(async () => { render(<App />); });

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to admin dashboard
    const adminLink = screen.getByRole('link', { name: 'Admin' });
    await user.click(adminLink);

    // Wait for admin dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    // Switch to applications tab
    const applicationsTab = screen.getByRole('tab', { name: /applications/i });
    await user.click(applicationsTab);

    // Should load admin dashboard
    await waitFor(() => {
      expect(screen.getByText('Student One')).toBeInTheDocument();
      expect(screen.getByText('Scholarship 1')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    // Verify API calls
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/admin/scholarships');
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/admin/applications');
  });

  test('search functionality filters scholarships', async () => {
    const user = userEvent;

    // Mock scholarships data
    const mockScholarships = [
      {
        id: 1,
        title: 'Engineering Scholarship',
        description: 'For engineering students',
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
    ];

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/search/scholarships')) {
        const urlObj = new URL(url, 'http://localhost');
        const query = urlObj.searchParams.get('q') || '';
        
        let filteredScholarships = mockScholarships;
        if (query) {
          filteredScholarships = mockScholarships.filter(s => 
            s.title.toLowerCase().includes(query.toLowerCase()) ||
            s.description.toLowerCase().includes(query.toLowerCase())
          );
        }
        
        return Promise.resolve({ data: {
          scholarships: filteredScholarships,
          pagination: { pages: 1, total: filteredScholarships.length, page: 1, per_page: 12, has_next: false, has_prev: false }
        }});
      }
      if (url === '/api/scholarships') {
        return Promise.resolve({ data: mockScholarships.slice(0, 3) });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    await act(async () => { render(<App />); });

    // Navigate to scholarships
    const scholarshipsLink = screen.getByRole('link', { name: 'Browse Scholarships' });
    await user.click(scholarshipsLink);

    // Should show all scholarships initially
    await waitFor(() => {
      expect(screen.getByText('Engineering Scholarship')).toBeInTheDocument();
      expect(screen.getByText('Arts Scholarship')).toBeInTheDocument();
    });

    // Search for engineering
    const searchInput = screen.getByLabelText(/search scholarships/i);
    await user.type(searchInput, 'engineering');

    // Should filter results
    await waitFor(() => {
      expect(screen.getByText('Engineering Scholarship')).toBeInTheDocument();
      expect(screen.queryByText('Arts Scholarship')).not.toBeInTheDocument();
    });
  });
});
