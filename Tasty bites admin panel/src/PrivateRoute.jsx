import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateRoute = ({ role }) => {
  const token = localStorage.getItem('token');

  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode(token);
    if (decoded.role === role) {
      return <Outlet />;
    } else {
      return <Navigate to="/login" />;
    }
  } catch (err) {
    return <Navigate to="/login" />;
  }
};

export default PrivateRoute;
