import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import UravinLoading from './UravinLoading';
import AccessExpiredScreen from './AccessExpiredScreen';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, accountAccess, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF6F0]">
        <UravinLoading size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, check if their 6-month access has expired
  const isExpired = accountAccess && (accountAccess.isAccessActive === false || accountAccess.status === 'expired');

  if (isExpired) {
    return <AccessExpiredScreen />;
  }

  return children;
};

export default ProtectedRoute;
