// src/components/core/Auth/AdminRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);

  // Check if user is logged in and is an Admin
  if (token !== null && user?.accountType === 'Admin') {
    // If authorized, render the children (or Outlet for nested routes)
    return children ? children : <Outlet />;
  } else {
    // If not authorized, redirect to login page
    // You might want to show a toast message here as well
    console.log("Redirecting: Not logged in or not an Admin");
    return <Navigate to="/login" replace />;
  }
};

export default AdminRoute;