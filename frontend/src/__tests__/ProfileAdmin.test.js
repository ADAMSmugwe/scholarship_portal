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

describe('Profile Management and Admin Functions Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('user can view and update their profile', async () => {
    

    // Mock authenticated user
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/profile/') {
        return Promise.resolve({
          data: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'student',
            bio: 'A student interested in scholarships',
            phone: '123-456-7890'
          }
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    mockedAxios.put.mockResolvedValue({
      data: {
        id: 1,
        name: 'Updated User',
        email: 'test@example.com',
        role: 'student',
        bio: 'Updated bio',
        phone: '098-765-4321'
      }
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to profile
    const profileLink = screen.getByRole('link', { name: /profile/i });
    await user.click(profileLink);

    // Verify profile data is displayed
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A student interested in scholarships')).toBeInTheDocument();

    // Update profile
    const nameInput = screen.getByLabelText(/name/i);
    const bioInput = screen.getByLabelText(/bio/i);
    const phoneInput = screen.getByLabelText(/phone/i);
    const updateButton = screen.getByRole('button', { name: /update profile/i });

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated User');
    await user.clear(bioInput);
    await user.type(bioInput, 'Updated bio');
    await user.clear(phoneInput);
    await user.type(phoneInput, '098-765-4321');

    await user.click(updateButton);

    // Verify update was called with correct data
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/profile/', {
        name: 'Updated User',
        bio: 'Updated bio',
        phone: '098-765-4321'
      });
    });

    // Verify success message
    expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
  });

  test('admin can view all users', async () => {
    

    // Mock admin user
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
      if (url === '/api/admin/users') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Admin User',
              email: 'admin@example.com',
              role: 'admin'
            },
            {
              id: 2,
              name: 'Student User',
              email: 'student@example.com',
              role: 'student'
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

    // Navigate to admin dashboard
    const adminLink = screen.getByRole('link', { name: /admin/i });
    await user.click(adminLink);

    // Verify users are displayed
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Student User')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('student@example.com')).toBeInTheDocument();
    });
  });

  test('admin can view all applications', async () => {
    

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
      if (url === '/api/admin/applications') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              user_id: 2,
              scholarship_id: 1,
              status: 'pending',
              personal_statement: 'I need this scholarship',
              created_at: '2024-01-01T00:00:00',
              user: { name: 'Student User', email: 'student@example.com' },
              scholarship: { title: 'Test Scholarship' }
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

    // Navigate to admin dashboard
    const adminLink = screen.getByRole('link', { name: /admin/i });
    await user.click(adminLink);

    // Verify applications are displayed
    await waitFor(() => {
      expect(screen.getByText('Student User')).toBeInTheDocument();
      expect(screen.getByText('Test Scholarship')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
  });

  test('admin can update application status', async () => {
    

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
      if (url === '/api/admin/applications') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              user_id: 2,
              scholarship_id: 1,
              status: 'pending',
              personal_statement: 'I need this scholarship',
              created_at: '2024-01-01T00:00:00',
              user: { name: 'Student User', email: 'student@example.com' },
              scholarship: { title: 'Test Scholarship' }
            }
          ]
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    mockedAxios.put.mockResolvedValue({
      data: {
        id: 1,
        status: 'approved'
      }
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to admin dashboard
    const adminLink = screen.getByRole('link', { name: /admin/i });
    await user.click(adminLink);

    // Wait for applications to load
    await waitFor(() => {
      expect(screen.getByText('Student User')).toBeInTheDocument();
    });

    // Update application status
    const statusSelect = screen.getByRole('combobox');
    const updateButton = screen.getByRole('button', { name: /update/i });

    await user.selectOptions(statusSelect, 'approved');
    await user.click(updateButton);

    // Verify update was called
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/admin/applications/1', {
        status: 'approved'
      });
    });

    // Verify success message
    expect(screen.getByText(/application status updated/i)).toBeInTheDocument();
  });

  test('admin can create new scholarship', async () => {
    

    // Mock admin user
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
      return Promise.reject(new Error('Unknown URL'));
    });

    mockedAxios.post.mockResolvedValue({
      data: {
        id: 1,
        title: 'New Scholarship',
        description: 'A new scholarship',
        amount: 10000,
        deadline: '2024-12-31T00:00:00'
      }
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to admin dashboard
    const adminLink = screen.getByRole('link', { name: /admin/i });
    await user.click(adminLink);

    // Fill scholarship form
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);
    const deadlineInput = screen.getByLabelText(/deadline/i);
    const createButton = screen.getByRole('button', { name: /create scholarship/i });

    await user.type(titleInput, 'New Scholarship');
    await user.type(descriptionInput, 'A new scholarship');
    await user.type(amountInput, '10000');
    await user.type(deadlineInput, '2024-12-31');

    await user.click(createButton);

    // Verify create was called with correct data
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/admin/scholarships', {
        title: 'New Scholarship',
        description: 'A new scholarship',
        amount: 10000,
        deadline: '2024-12-31T00:00:00'
      });
    });

    // Verify success message
    expect(screen.getByText(/scholarship created successfully/i)).toBeInTheDocument();
  });

  test('student cannot access admin functions', async () => {
    

    // Mock student user
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/profile/') {
        return Promise.resolve({
          data: {
            id: 2,
            name: 'Student User',
            email: 'student@example.com',
            role: 'student'
          }
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

    // Admin link should not be visible
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();

    // Try to navigate to admin route directly
    window.history.pushState({}, '', '/admin');

    // Should redirect to home or show unauthorized message
    await waitFor(() => {
      expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
    });
  });

  test('profile update handles server errors', async () => {
    

    // Mock authenticated user
    mockedAxios.get.mockResolvedValue({
      data: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'student'
      }
    });

    // Mock server error on update
    mockedAxios.put.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Invalid data provided' }
      }
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to profile
    const profileLink = screen.getByRole('link', { name: /profile/i });
    await user.click(profileLink);

    // Update profile
    const nameInput = screen.getByLabelText(/name/i);
    const updateButton = screen.getByRole('button', { name: /update profile/i });

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated User');
    await user.click(updateButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid data provided/i)).toBeInTheDocument();
    });
  });
});
