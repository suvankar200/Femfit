import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AssessmentWizard from './pages/AssessmentWizard';
import TestRecommendations from './pages/TestRecommendations';
import './index.css';

// ── If NOT logged in → redirect to /login ─────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ── If ALREADY logged in → redirect to /dashboard (back button safe) ──────────
const PublicOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Root → dashboard (if logged in) or login (if not) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Public routes — redirect to dashboard if already logged in */}
            <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

            {/* Protected routes — redirect to login if not logged in */}
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route
              path="/assess/test-recommendations"
              element={<ProtectedRoute><TestRecommendations /></ProtectedRoute>}
            />
            <Route
              path="/assess/:type"
              element={<ProtectedRoute><AssessmentWizard /></ProtectedRoute>}
            />

            {/* 404 — send unknown URLs to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
