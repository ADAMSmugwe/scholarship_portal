import React from 'react';
import { render, screen, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { mockedAxios } from '../test-utils';
import App from '../App';

const user = userEvent.setup();

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
  beforeEach(async () => {
    jest.clearAllMocks();
    localStorage.clear();

    // Set up authentication
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'student'
    };
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    // Set up common mock responses
    mockedAxios.get.mockImplementation((url) => {
      switch(url) {
        case '/api/auth/check':
          return Promise.resolve({ data: mockUser });
        case '/api/profile/':
          return Promise.resolve({
            data: mockUser
          });
        case '/api/profile/extended':
          return Promise.resolve({
            data: {
              date_of_birth: '1995-01-01',
              phone_number: '123-456-7890',
              address: '123 Test St',
              city: 'Test City',
              state: 'Test State',
              country: 'Test Country',
              postal_code: '12345',
              current_school: 'Test University',
              major: 'Computer Science',
              gpa: 3.8,
              graduation_year: 2026,
              education_level: 'undergraduate',
              bio: 'Test bio',
              achievements: 'Test achievements',
              extracurricular_activities: 'Test activities',
              completion_percentage: 85
            }
          });
        default:
          return Promise.reject(new Error('Unknown URL'));
      }
    });
    localStorage.setItem('token', 'mock-jwt-token');
  });

  test('user can view and update their profile', async () => {
    // Set up auth token in axios defaults
    mockedAxios.defaults.headers.common['Authorization'] = 'Bearer mock-jwt-token';

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
    const profileLink = await screen.findByRole('link', { name: /profile/i });
    await userEvent.click(profileLink);

    // Wait for profile data to be displayed
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A student interested in scholarships')).toBeInTheDocument();
    });

    // Update profile
    const nameInput = await screen.findByLabelText(/name/i);
    const bioInput = await screen.findByLabelText(/bio/i);
    const phoneInput = await screen.findByLabelText(/phone/i);
    const updateButton = await screen.findByRole('button', { name: /update/i });

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated User');
    await userEvent.clear(bioInput);
    await userEvent.type(bioInput, 'Updated bio');
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '098-765-4321');

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

    // Wait for profile link to appear in navigation
    const profileLink = await screen.findByRole('link', { name: /profile/i });
    await userEvent.click(profileLink);

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

  test('user can view and update extended profile information', async () => {
    await customRender(<App />, { authenticated: true });

    // Click account menu
    const accountButton = screen.getByLabelText(/account of current user/i);
    await user.click(accountButton);

    // Click profile in menu 
    const profileMenuItem = screen.getByRole('menuitem', { name: /profile/i });
    await user.click(profileMenuItem);
    const extendedProfileTab = screen.getByRole('tab', { name: /academic information/i });
    await user.click(extendedProfileTab);

    // Verify extended profile data is displayed
    expect(screen.getByDisplayValue('Test University')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Computer Science')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3.8')).toBeInTheDocument();

    // Update extended profile
    mockedAxios.put.mockResolvedValueOnce({
      data: {
        message: 'Profile updated successfully',
        completion_percentage: 90
      }
    });

    const schoolInput = screen.getByLabelText(/current school/i);
    const majorInput = screen.getByLabelText(/major/i);
    const gpaInput = screen.getByLabelText(/gpa/i);
    const updateButton = screen.getByRole('button', { name: /update academic information/i });

    await user.clear(schoolInput);
    await user.type(schoolInput, 'New University');
    await user.clear(majorInput);
    await user.type(majorInput, 'Data Science');
    await user.clear(gpaInput);
    await user.type(gpaInput, '4.0');

    await user.click(updateButton);

    // Verify update was called with correct data
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/profile/extended', {
        current_school: 'New University',
        major: 'Data Science',
        gpa: '4.0'
      });
    });
  });

  test('user can upload profile documents', async () => {
    render(<App />);

    // Navigate to documents section
    const profileLink = screen.getByRole('link', { name: /profile/i });
    await user.click(profileLink);
    const documentsTab = screen.getByRole('tab', { name: /documents/i });
    await user.click(documentsTab);

    // Mock file upload response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        message: 'Document uploaded successfully',
        url: '/uploads/documents/test_transcript.pdf'
      }
    });

    // Upload transcript
    const file = new File(['test pdf content'], 'test_transcript.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/upload transcript/i);
    await user.upload(fileInput, file);

    // Verify upload was called correctly
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/profile/upload/transcript',
        expect.any(FormData),
        expect.any(Object)
      );
    });
  });

  test('displays profile completion percentage', async () => {
    render(<App />);

    // Navigate to profile through the account menu
    const accountButton = screen.getByLabelText(/account of current user/i);
    await user.click(accountButton);
    const profileMenuItem = screen.getByRole('menuitem', { name: /profile/i });
    await user.click(profileMenuItem);

    // Verify completion percentage is displayed
    await waitFor(() => {
      const completionText = screen.getByText(/85%/);
      expect(completionText).toBeInTheDocument();
    });
  });

  test('handles invalid document upload', async () => {
    render(<App />);

    // Navigate to documents section through the account menu
    const accountButton = screen.getByLabelText(/account of current user/i);
    await user.click(accountButton);
    const profileMenuItem = screen.getByRole('menuitem', { name: /profile/i });
    await user.click(profileMenuItem);
    const documentsTab = screen.getByRole('tab', { name: /documents/i });
    await user.click(documentsTab);

    // Mock error response
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Invalid file type. Allowed types: pdf, doc, docx'
        }
      }
    });

    // Try to upload invalid file
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/upload transcript/i);
    await user.upload(fileInput, file);

    // Verify error message is displayed
    await waitFor(() => {
      const errorMessage = screen.getByText(/Invalid file type/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });
});
