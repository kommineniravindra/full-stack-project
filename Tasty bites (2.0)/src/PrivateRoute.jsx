import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateRoute = ({ role }) => { // No need for 'children' prop here anymore for nested routes
  const token = localStorage.getItem('token');

  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode(token);
    if (decoded.role === role) {
      return <Outlet />; // Render the nested routes
    } else {
      // If role doesn't match, redirect to login (or an unauthorized page)
      return <Navigate to="/login" />;
    }
  } catch (err) {
    // If token is invalid/expired, redirect to login
    return <Navigate to="/login" />;
  }
};

export default PrivateRoute;