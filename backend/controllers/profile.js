const Profile = require('../models/profile');
const User = require('../models/user');
const CourseProgress = require('../models/courseProgress');
const Course = require('../models/course');
const { pool } = require('../config/database');

const express = require("express");
const fileUpload = require("express-fileupload");

const app = express();
app.use(fileUpload());

const {
  uploadImageToCloudinary,
  deleteResourceFromCloudinary,
} = require('../utils/imageUploader');
const { convertSecondsToDuration } = require('../utils/secToDuration');

// ================ update Profile ================
exports.updateProfile = async (req, res) => {
  let connection;
  try {
    const {
      gender = '',
      dateOfBirth = '',
      about = '',
      contactNumber = '',
      firstName,
      lastName,
    } = req.body;

    const userId = req.user.id;
    connection = await pool.getConnection();

    // Update user details
    const updateUserQuery = `
      UPDATE users 
      SET firstName = ?, lastName = ?
      WHERE id = ?
    `;
    await connection.execute(updateUserQuery, [firstName, lastName, userId]);

    // Update profile details
    const updateProfileQuery = `
      UPDATE profiles 
      SET gender = ?, dateOfBirth = ?, about = ?, contactNumber = ?
      WHERE userId = ?
    `;
    await connection.execute(updateProfileQuery, [gender, dateOfBirth, about, contactNumber, userId]);

    // Get updated user details
    const [userDetails] = await connection.execute(
      `SELECT u.*, p.* 
       FROM users u 
       LEFT JOIN profiles p ON u.id = p.userId 
       WHERE u.id = ?`,
      [userId]
    );

    res.status(200).json({
      success: true,
      updatedUserDetails: userDetails[0],
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.log('Error while updating profile', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error while updating profile',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// ================ delete Account ================
exports.deleteAccount = async (req, res) => {
    let connection;
    try {
        const userId = req.user.id;
        console.log('Deleting account for user:', userId);
        
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Get user details first
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const userDetails = users[0];
        console.log('Found user:', userDetails);

        // Delete profile picture from Cloudinary if exists
        if (userDetails.image && userDetails.image.includes('cloudinary')) {
            try {
                const publicId = userDetails.image.split('/').pop().split('.')[0];
                await deleteResourceFromCloudinary(publicId);
                console.log('Deleted profile picture from Cloudinary');
            } catch (error) {
                console.log('Error deleting profile picture:', error);
                // Continue with deletion even if image deletion fails
            }
        }

        // Delete all related data in a specific order
        const deleteQueries = [
            { query: 'DELETE FROM courseProgress WHERE userId = ?', name: 'course progress' },
            { query: 'DELETE FROM profiles WHERE userId = ?', name: 'profile' },
            { query: 'DELETE FROM users WHERE id = ?', name: 'user' }
        ];

        for (const { query, name } of deleteQueries) {
            try {
                const [result] = await connection.execute(query, [userId]);
                console.log(`Deleted ${name}:`, result.affectedRows);
            } catch (error) {
                console.error(`Error deleting ${name}:`, error);
                throw error;
            }
        }

        // Commit transaction
        await connection.commit();
        console.log('Transaction committed successfully');

        // Release connection before sending response
        connection.release();
        connection = null;

        return res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error) {
        console.error('Error while deleting profile:', error);
        
        // Rollback in case of error
        if (connection) {
            try {
                await connection.rollback();
                console.log('Transaction rolled back due to error');
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError);
            }
        }

        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while deleting profile',
        });
    } finally {
        if (connection) {
            try {
                connection.release();
                console.log('Database connection released');
            } catch (releaseError) {
                console.error('Error releasing connection:', releaseError);
            }
        }
    }
};

// ================ get details of user ================
exports.getUserDetails = async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    connection = await pool.getConnection();

    const [userDetails] = await connection.execute(
      `SELECT u.*, p.* 
       FROM users u 
       LEFT JOIN profiles p ON u.id = p.userId 
       WHERE u.id = ?`,
      [userId]
    );

    if (userDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: userDetails[0],
      message: 'User data fetched successfully',
    });
  } catch (error) {
    console.log('Error while fetching user details', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error while fetching user details',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// ================ Update User profile Image ================
exports.updateUserProfileImage = async (req, res) => {
    let connection;
    try {
        console.log("Received files:", req.files);

        // Check if file exists in request
        if (!req.files || !req.files.profileImage) {
            return res.status(400).json({
                success: false,
                message: "No image file provided",
            });
        }

        const profileImage = req.files.profileImage;
        const userId = req.user.id;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(profileImage.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file type. Only JPEG, JPG, and PNG are allowed",
            });
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024;
        if (profileImage.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: "File size too large. Max size is 2MB",
            });
        }

        // Get database connection
        connection = await pool.getConnection();

        // Get current user image
        const [users] = await connection.execute(
            'SELECT image FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const user = users[0];

        // Delete old image from Cloudinary if exists
        if (user.image && user.image.includes("cloudinary")) {
            const publicId = user.image.split("/").pop().split(".")[0];
            try {
                await deleteResourceFromCloudinary(publicId);
            } catch (err) {
                console.log("Error deleting old image:", err.message);
            }
        }

        // Upload new image to Cloudinary
        const image = await uploadImageToCloudinary(
            profileImage,
            process.env.FOLDER_NAME || "StudyNotionProfileImages",
            1000,
            1000
        );

        // Update user image in database
        const updateQuery = 'UPDATE users SET image = ? WHERE id = ?';
        await connection.execute(updateQuery, [image.secure_url, userId]);

        // Get updated user details
        const [updatedUser] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            data: updatedUser[0],
            message: 'Profile image updated successfully',
        });
    } catch (error) {
        console.log('Error while updating profile image:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while updating profile image',
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ================ Get Enrolled Courses ================
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    let userDetails = await User.findById(userId)
      .populate({
        path: 'courses',
        populate: {
          path: 'courseContent',
          populate: {
            path: 'subSection',
          },
        },
      })
      .exec();

    userDetails = userDetails.toObject();

    for (let i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0;
      let SubsectionLength = 0;

      for (let j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        const subSections = userDetails.courses[i].courseContent[j].subSection;
        totalDurationInSeconds += subSections.reduce(
          (acc, curr) => acc + parseInt(curr.timeDuration),
          0
        );
        SubsectionLength += subSections.length;
      }

      userDetails.courses[i].totalDuration =
        convertSecondsToDuration(totalDurationInSeconds);

      const courseProgress = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      });

      const completedCount = courseProgress?.completedVideos?.length || 0;
      userDetails.courses[i].progressPercentage =
        SubsectionLength === 0
          ? 100
          : Math.round((completedCount / SubsectionLength) * 10000) / 100;
    }

    res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    console.error('Error in getEnrolledCourses', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================ instructor Dashboard ================
exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id });

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnrolled.length;
      const totalAmountGenerated = totalStudentsEnrolled * course.price;

      return {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        totalStudentsEnrolled,
        totalAmountGenerated,
      };
    });

    res.status(200).json({
      courses: courseData,
      message: 'Instructor Dashboard Data fetched successfully',
    });
  } catch (error) {
    console.error('Error in instructorDashboard', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
