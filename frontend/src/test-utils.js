import React, { createContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Create AuthContext for testing
export const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  loading: false
});
// Mock MUI components
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ value, onChange, label }) => (
    <input
      type="date"
      value={value ? value.toISOString().split('T')[0] : ''}
      onChange={(e) => onChange(new Date(e.target.value))}
      aria-label={label}
      data-testid="date-picker"
    />
  )
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <>{children}</>
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: class {}
}));

jest.mock('@mui/icons-material/AccountCircle', () => ({
  __esModule: true,
  default: () => <svg data-testid="AccountCircleIcon" aria-label="account of current user" />
}));

import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from './context/AuthContext';

// Mock axios
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios;

// Test theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Custom render function that includes all providers
const AllTheProviders = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Helper to set up authentication
const setupAuth = async (mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'student'
}) => {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem('user', JSON.stringify(mockUser));
  
  mockedAxios.get.mockImplementation((url) => {
    if (url === '/api/auth/check') {
      return Promise.resolve({ data: mockUser });
    }
    return Promise.resolve({ data: {} });
  });
};

const customRender = async (ui, options = {}) => {
  const rendered = render(ui, { wrapper: AllTheProviders, ...options });
  if (options.authenticated) {
    await setupAuth(options.mockUser);
    // Wait for auth to be initialized
    await waitFor(() => {
      expect(screen.getByLabelText(/account of current user/i)).toBeInTheDocument();
    });
  }
  return rendered;
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock MUI Date Picker components
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ value, onChange, label }) => (
    <input
      type="date"
      value={value ? value.toISOString().split('T')[0] : ''}
      onChange={(e) => onChange(new Date(e.target.value))}
      aria-label={label}
      data-testid="date-picker"
    />
  )
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <>{children}</>
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: class {}
}));
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { screen, waitFor, mockedAxios, AuthContext };
export { customRender as render };
export default customRender;
