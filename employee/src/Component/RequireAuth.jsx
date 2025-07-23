import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />; // ถ้าไม่มี token ไปหน้า Login
  }
  return children;
};

export default RequireAuth;
