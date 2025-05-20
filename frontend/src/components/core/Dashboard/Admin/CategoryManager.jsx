// src/components/core/Dashboard/Admin/CategoryManager.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { fetchCourseCategories } from '../../../../services/operations/courseDetailsAPI'; // Use the correct path
import CategoryForm from './CategoryForm';
import { toast } from 'react-hot-toast';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const getCategories = useCallback(async () => {
    setLoading(true);
    try {
      // Assuming fetchCourseCategories returns the array of categories directly
      const response = await fetchCourseCategories();
      // Ensure response is an array before setting state
      if (Array.isArray(response)) {
          setCategories(response);
      } else {
          console.error("Fetched categories is not an array:", response);
          setCategories([]); // Set empty array if response is invalid
          toast.error("Could not load categories properly.");
      }

    } catch (error) {
      console.error("Could not fetch categories:", error);
      toast.error("Could not fetch categories");
      setCategories([]); // Set empty on error
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this useCallback instance is created once

  useEffect(() => {
    getCategories();
  }, [getCategories]); // getCategories is stable due to useCallback

  const handleCategoryAdded = () => {
    // Refetch categories after a new one is added
    getCategories();
  };

  return (
    <div className="space-y-8 text-richblack-5 p-4 md:p-8">
      <h1 className="text-3xl font-medium">Category Management</h1>

      {/* Add New Category Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Add New Category</h2>
        <CategoryForm onSuccess={handleCategoryAdded} />
      </div>

      {/* Existing Categories Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Existing Categories</h2>
        {loading ? (
          <div className="flex justify-center items-center min-h-[100px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-50"></div>
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category._id}
                className="p-4 border border-richblack-700 bg-richblack-800 rounded-md"
              >
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <p className="text-richblack-300 mt-1 text-sm">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
            <p className="text-richblack-300">No categories found. Add one above!</p>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;