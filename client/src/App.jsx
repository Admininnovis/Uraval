import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Main Pages
import Dashboard from './pages/Dashboard';
import EventLedger from './pages/EventLedger';
import EventLedgerDetail from './pages/EventLedgerDetail';
import PersonalLedger from './pages/PersonalLedger';
import PersonalLedgerDetail from './pages/PersonalLedgerDetail';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventLedger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventLedgerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personal-ledger"
            element={
              <ProtectedRoute>
                <PersonalLedger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personal-ledger/:id"
            element={
              <ProtectedRoute>
                <PersonalLedgerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
