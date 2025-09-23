// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

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
  LocalizationProvider: ({ children }) => children
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: class {}
}));

// Mock MUI hooks and utilities
jest.mock('@mui/material/useMediaQuery', () => {
  return jest.fn(() => false);
});

jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({
    breakpoints: {
      down: () => '@media (max-width:900px)',
      up: () => '@media (min-width:900px)'
    },
    palette: {
      mode: 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' }
    }
  })
}));

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function(query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  };
};

// Mock MUI Date Picker components

// Polyfills for React Router v7
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
