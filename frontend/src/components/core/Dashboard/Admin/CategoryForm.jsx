// src/components/core/Dashboard/Admin/CategoryForm.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createCategory } from '../../../../services/operations/courseDetailsAPI'; // Use the correct path
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import IconBtn from '../../../common/IconBtn'; // Assuming you have an IconBtn component

const CategoryForm = ({ onSuccess }) => {
  const { token } = useSelector((state) => state.auth);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    if (!data.name || !data.description) {
        toast.error("Please fill in both fields");
        return;
    }
    setLoading(true);
    try {
      const result = await createCategory(data, token);
      if (result) { // Check if API call was successful (adjust based on API response)
        toast.success("Category Created Successfully");
        reset(); // Clear the form
        if (onSuccess) {
            onSuccess(); // Trigger refetch in parent component
        }
      } else {
        toast.error("Could not create category"); // Handle potential API errors signaled differently
      }
    } catch (error) {
      console.error("ERROR IN CREATING CATEGORY", error);
      toast.error("Could not create category: " + (error?.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-6"
    >
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="name">
          Category Name <sup className="text-pink-200">*</sup>
        </label>
        <input
          id="name"
          placeholder="Enter category name (e.g., Web Development)"
          {...register('name', { required: true })}
          className="form-style w-full"
          disabled={loading}
        />
        {errors.name && (
          <span className="ml-2 text-xs tracking-wide text-pink-200">
            Category name is required
          </span>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-sm text-richblack-5" htmlFor="description">
          Category Description <sup className="text-pink-200">*</sup>
        </label>
        <textarea
          id="description"
          placeholder="Enter category description"
          {...register('description', { required: true })}
          className="form-style min-h-[100px] w-full resize-none"
          disabled={loading}
        />
        {errors.description && (
          <span className="ml-2 text-xs tracking-wide text-pink-200">
            Category description is required
          </span>
        )}
      </div>

      <IconBtn
        type="submit"
        disabled={loading}
        text={loading ? 'Creating...' : 'Create Category'}
      />
    </form>
  );
};

export default CategoryForm;