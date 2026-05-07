import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user } = useSelector((state) => state.auth);

  if (!token) return <Navigate to="/login" replace />;
  
  // If route is adminOnly but user is NOT admin -> Kick to dashboard
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  
  // If route is NOT adminOnly (e.g. /dashboard) but user IS admin -> Kick to admin
  // This prevents admins from entering the user portal.
  if (!adminOnly && user?.role === 'admin') return <Navigate to="/admin" replace />;

  return children;
}
