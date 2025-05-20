const Category = require('../models/category')

// get Random Integer
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

// ================ create Category ================
// exports.createCategory = async (req, res) => {
//     try {
//         // extract data
//         const { name, description } = req.body;

//         // validation
//         if (!name || !description) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'All fields are required'
//             });
//         }

//         const categoryDetails = await Category.create({
//             name: name, description: description
//         });

//         res.status(200).json({
//             success: true,
//             message: 'Category created successfully'
//         });
//     }
//     catch (error) {
//         console.log('Error while creating Category');
//         console.log(error);
//         res.status(500).json({
//             success: false,
//             message: 'Error while creating Category',
//             error: error.message
//         })
//     }
// }

exports.createCategory = async (req, res) => {
    try {
      const { name, description } = req.body;
  
      if (!name || !description) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }
  
      await Category.create({ name, description });
  
      res.status(200).json({
        success: true,
        message: 'Category created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error while creating Category',
        error: error.message
      });
    }
  };
  


// ================ get All Category ================
exports.showAllCategories = async (req, res) => {
    try {
        // get all categories from DB
        const allCategories = await Category.findAll();

        if (!allCategories || allCategories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No categories found'
            });
        }

        // return response
        return res.status(200).json({
            success: true,
            data: allCategories,
            message: 'All categories fetched successfully'
        });
    }
    catch (error) {
        console.log('Error while fetching all categories');
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error while fetching all categories',
            error: error.message
        });
    }
}



// ================ Get Category Page Details ================
exports.getCategoryPageDetails = async (req, res) => {
    try {
        const { categoryId } = req.body
        console.log("Received request for categoryId:", categoryId);

        // Get courses for the specified category
        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: "ratingAndReviews",
            })
            .exec()

        console.log("Found category:", selectedCategory ? {
            id: selectedCategory._id,
            name: selectedCategory.name,
            courseCount: selectedCategory.courses?.length
        } : "Category not found");

        // Handle the case when the category is not found
        if (!selectedCategory) {
            console.log("Category not found for ID:", categoryId);
            return res.status(404).json({ 
                success: false, 
                message: "Category not found",
                categoryId: categoryId 
            })
        }

        // Handle the case when there are no courses
        if (!selectedCategory.courses || selectedCategory.courses.length === 0) {
            console.log("No courses found for category:", selectedCategory.name);
            return res.status(200).json({
                success: true,
                data: {
                    selectedCategory: {
                        ...selectedCategory.toObject(),
                        courses: []
                    },
                    differentCategory: null,
                    mostSellingCourses: []
                },
                message: "No courses found for the selected category."
            })
        }

        // Get courses for other categories
        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },
        })

        let differentCategory = null;
        if (categoriesExceptSelected.length > 0) {
            differentCategory = await Category.findOne(
                categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id
            )
            .populate({
                path: "courses",
                match: { status: "Published" },
            })
            .exec()
        }

        // Get top-selling courses across all categories
        const allCategories = await Category.find()
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: {
                    path: "instructor",
                },
            })
            .exec()

        const allCourses = allCategories.flatMap((category) => category.courses)
        const mostSellingCourses = allCourses
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 10)

        console.log("Sending response with:", {
            selectedCategoryCourses: selectedCategory.courses.length,
            differentCategoryCourses: differentCategory?.courses?.length || 0,
            mostSellingCoursesCount: mostSellingCourses.length
        });

        res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses,
            },
        })
    } catch (error) {
        console.error("Error in getCategoryPageDetails:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        })
    }
}