// import React from 'react'
// import { toast } from "react-hot-toast"
// import { apiConnector } from '../apiConnector';
// import { catalogData } from '../apis';


// // ================ get Catalog Page Data  ================
// export const getCatalogPageData = async (categoryId) => {
//   const toastId = toast.loading("Loading...");
//   let result = null;
  
//   try {
//     if (!categoryId) {
//       throw new Error("Category ID is required");
//     }

//     console.log("Sending request with categoryId:", categoryId);
//     const response = await apiConnector("POST", catalogData.CATALOGPAGEDATA_API, {
//       categoryId: categoryId,
//     });

//     console.log("CATALOG PAGE DATA API RESPONSE............", response);

//     if (!response?.data) {
//       throw new Error("No data received from server");
//     }

//     if (!response.data.success) {
//       throw new Error(response.data.message || "Could not fetch category page data");
//     }

//     if (!response.data.data) {
//       throw new Error("Invalid data format received from server");
//     }

//     result = response.data.data;
//   } catch (error) {
//     console.log("CATALOG PAGE DATA API ERROR....", error);
//     if (error.response) {
//       // Server responded with error
//       console.error("Server error details:", error.response.data);
//       toast.error(error.response.data.message || "Failed to fetch catalog data");
//     } else if (error.request) {
//       // Network error
//       console.error("Network error:", error.request);
//       toast.error("Network error. Please check your connection");
//     } else {
//       // Other errors
//       console.error("Error:", error.message);
//       toast.error(error.message || "An unexpected error occurred");
//     }
//   } finally {
//     toast.dismiss(toastId);
//   }
  
//   return result;
// }



import { toast } from "react-hot-toast";
import { apiConnector } from "../apiConnector";
import { catalogData } from "../apis";

// ================ get Catalog Page Data ================
export const getCatalogPageData = async (categoryId) => {
  const toastId = toast.loading("Loading catalog data...");
  let result = null;

  try {
    if (!categoryId) {
      throw new Error("Category ID is required");
    }

    console.log("Sending request with categoryId:", categoryId);
    const response = await apiConnector("POST", catalogData.CATALOGPAGEDATA_API, {
      categoryId,
    });

    console.log("CATALOG PAGE DATA API RESPONSE:", response);

    const resData = response?.data;

    // Handle case when no courses are found
    if (resData?.success === false && resData?.message?.includes("No courses found")) {
      return {
        selectedCategory: { name: "No Courses", courses: [] },
        differentCategory: null,
        mostSellingCourses: [],
      };
    }

    if (!resData || !resData.success || !resData.data) {
      throw new Error(resData?.message || "Invalid response from server");
    }

    // Structure validation
    const data = resData.data;
    if (
      !data.selectedCategory ||
      !Array.isArray(data.selectedCategory.courses)
    ) {
      throw new Error("Selected category data is malformed");
    }

    result = {
      selectedCategory: data.selectedCategory,
      differentCategory: data.differentCategory || null,
      mostSellingCourses: data.mostSellingCourses || [],
    };
  } catch (error) {
    console.error("CATALOG PAGE DATA API ERROR:", error);

    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.request) {
      toast.error("Network error. Please check your internet connection.");
    } else {
      toast.error(error.message || "Something went wrong while loading the catalog");
    }
  } finally {
    toast.dismiss(toastId);
  }

  return result;
};
