// src/pages/AdminDashboard.jsx
import React from 'react';
import CategoryManager from '../components/core/Dashboard/Admin/CategoryManager';

const AdminDashboard = () => {
  return (
    <div className="container mx-auto py-8">
      {/* You can add more admin components here later */}
      <CategoryManager />
    </div>
  );
};

export default AdminDashboard;