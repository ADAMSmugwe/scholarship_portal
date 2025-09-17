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

describe('Form Validation and Error Handling Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('registration form validates required fields', async () => {
    

    render(<App />);

    // Navigate to registration
    const registerLink = screen.getByRole('link', { name: /register/i });
    await user.click(registerLink);

    // Try to submit empty form
    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('registration form validates email format', async () => {
    

    render(<App />);

    // Navigate to registration
    const registerLink = screen.getByRole('link', { name: /register/i });
    await user.click(registerLink);

    // Fill form with invalid email
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    // Should show email validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  test('login form handles server errors gracefully', async () => {
    

    // Mock server error
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 500,
        data: { error: 'Internal server error' }
      }
    });

    render(<App />);

    // Navigate to login
    const loginLink = screen.getByRole('link', { name: /login/i });
    await user.click(loginLink);

    // Fill and submit form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Should show server error message
    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  test('network errors are handled gracefully', async () => {
    

    // Mock network error
    mockedAxios.post.mockRejectedValue(new Error('Network Error'));

    render(<App />);

    // Navigate to login
    const loginLink = screen.getByRole('link', { name: /login/i });
    await user.click(loginLink);

    // Fill and submit form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Should show network error message
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  test('application form validates required fields', async () => {
    

    // Mock authenticated user and scholarship
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

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication and navigate to scholarship
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to scholarship detail
    const scholarshipsLink = screen.getByRole('link', { name: /scholarships/i });
    await user.click(scholarshipsLink);

    await waitFor(() => {
      const scholarshipCard = screen.getByText('Test Scholarship');
      user.click(scholarshipCard);
    });

    // Try to submit empty application form
    const submitButton = screen.getByRole('button', { name: /apply/i });
    await user.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/personal statement is required/i)).toBeInTheDocument();
    });
  });

  test('loading states are displayed during API calls', async () => {
    

    // Mock delayed response
    mockedAxios.post.mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          data: { access_token: 'mock-token', message: 'Logged in successfully' }
        }), 100)
      )
    );

    mockedAxios.get.mockResolvedValue({
      data: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'student'
      }
    });

    render(<App />);

    // Navigate to login
    const loginLink = screen.getByRole('link', { name: /login/i });
    await user.click(loginLink);

    // Fill and submit form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Should show loading state
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();

    // Should hide loading after response
    await waitFor(() => {
      expect(screen.queryByText(/logging in/i)).not.toBeInTheDocument();
    });
  });

  test('form submission is disabled during loading', async () => {
    

    // Mock delayed response
    mockedAxios.post.mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          data: { access_token: 'mock-token', message: 'Logged in successfully' }
        }), 100)
      )
    );

    render(<App />);

    // Navigate to login
    const loginLink = screen.getByRole('link', { name: /login/i });
    await user.click(loginLink);

    // Fill form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Button should be disabled during loading
    expect(loginButton).toBeDisabled();

    // Button should be enabled after response
    await waitFor(() => {
      expect(loginButton).not.toBeDisabled();
    });
  });

  test('duplicate application submission is prevented', async () => {
    

    // Mock authenticated user and existing application
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

    // Mock duplicate application error
    mockedAxios.post.mockRejectedValue({
      response: {
        data: { error: 'You have already applied for this scholarship' }
      }
    });

    localStorage.setItem('token', 'mock-jwt-token');

    render(<App />);

    // Wait for authentication and navigate to scholarship
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/profile/');
    });

    // Navigate to scholarship detail
    const scholarshipsLink = screen.getByRole('link', { name: /scholarships/i });
    await user.click(scholarshipsLink);

    await waitFor(() => {
      const scholarshipCard = screen.getByText('Test Scholarship');
      user.click(scholarshipCard);
    });

    // Fill and submit application
    const statementInput = screen.getByLabelText(/personal statement/i);
    const submitButton = screen.getByRole('button', { name: /apply/i });

    await user.type(statementInput, 'My application statement');
    await user.click(submitButton);

    // Should show duplicate application error
    await waitFor(() => {
      expect(screen.getByText(/you have already applied for this scholarship/i)).toBeInTheDocument();
    });
  });
});
