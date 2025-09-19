import React from 'react';
import { 
  BrowserRouter, 
  MemoryRouter, 
  Routes, 
  Route,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';

const Router = process.env.NODE_ENV === 'test' ? MemoryRouter : BrowserRouter;

// Future flags for React Router v7 compatibility
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/*"
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    />
  )
);
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import Scholarships from './pages/Scholarships';
import ScholarshipDetail from './pages/ScholarshipDetail';
import Applications from './pages/Applications';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scholarships" element={<Scholarships />} />
              <Route path="/scholarships/:id" element={<ScholarshipDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email/:token" element={<EmailVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/applications" element={
                <PrivateRoute>
                  <Applications />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
