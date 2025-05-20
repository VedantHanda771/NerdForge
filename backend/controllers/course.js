const Course = require('../models/course');
const User = require('../models/user');
const Category = require('../models/category');
const Section = require('../models/section')
const SubSection = require('../models/subSection')
const CourseProgress = require('../models/courseProgress')

const { uploadImageToCloudinary, deleteResourceFromCloudinary } = require('../utils/imageUploader');
const { convertSecondsToDuration } = require("../utils/secToDuration")



// ================ create new course ================
exports.createCourse = async (req, res) => {
    try {
        // extract data
        let { courseName, courseDescription, whatYouWillLearn, price, category, instructions: _instructions, status, tag: _tag } = req.body;

        // Convert the tag and instructions from stringified Array to Array
        const tag = typeof _tag === 'string' ? JSON.parse(_tag) : _tag || [];
        const instructions = typeof _instructions === 'string' ? JSON.parse(_instructions) : _instructions || [];

        // get thumbnail of course
        const thumbnail = req.files?.thumbnailImage;

        // Log request details for debugging
        console.log('Request details:', {
            body: req.body,
            files: req.files,
            thumbnail: thumbnail
        });

        // validation
        if (!courseName || !courseDescription || !whatYouWillLearn || !price
            || !category || !thumbnail || !instructions.length || !tag.length) {
            return res.status(400).json({
                success: false,
                message: 'All Fields are required'
            });
        }

        // Set default status if not provided
        status = status || "Draft";

        // check current user is instructor or not
        const instructorId = req.user.id;

        // check given category is valid or not
        const categoryDetails = await Category.findById(category);
        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: 'Category Details not found'
            });
        }

        // upload thumbnail to cloudinary
        console.log('Uploading thumbnail to Cloudinary...');
        const thumbnailDetails = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME || "LMS");
        console.log('Thumbnail upload result:', thumbnailDetails);

        if (!thumbnailDetails || !thumbnailDetails.secure_url) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload thumbnail'
            });
        }

        // create new course - entry in DB
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructorId,
            whatYouWillLearn,
            price,
            categoryId: category,
            tag,
            status,
            instructions,
            thumbnail: thumbnailDetails.secure_url
        });

        // return response
        res.status(200).json({
            success: true,
            data: newCourse,
            message: 'Course Created Successfully'
        });
    } catch (error) {
        console.log('Error while creating new course');
        console.log('Error details:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Error while creating new course'
        });
    }
}


// ================ show all courses ================
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.findAll();

        return res.status(200).json({
            success: true,
            data: allCourses,
            message: 'Data for all courses fetched successfully'
        });
    }
    catch (error) {
        console.log('Error while fetching data of all courses');
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while fetching data of all courses'
        })
    }
}



// ================ Get Course Details ================
exports.getCourseDetails = async (req, res) => {
    try {
        // get course ID
        const { courseId } = req.body;

        // find course details
        const courseDetails = await Course.findById(courseId);

        //validation
        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find the course with ${courseId}`,
            });
        }

        //return response
        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration: courseDetails.totalDuration || "0h 0m 0s"
            },
            message: 'Fetched course data successfully'
        })
    }
    catch (error) {
        console.log('Error while fetching course details');
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while fetching course details',
        });
    }
}


// ================ Get Full Course Details ================
exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body
        const userId = req.user.id
        // console.log('courseId userId  = ', courseId, " == ", userId)

        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec()

        let courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        })

        //   console.log("courseProgressCount : ", courseProgressCount)

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            })
        }

        // if (courseDetails.status === "Draft") {
        //   return res.status(403).json({
        //     success: false,
        //     message: `Accessing a draft course is forbidden`,
        //   });
        // }

        //   count total time duration of course
        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos ? courseProgressCount?.completedVideos : [],
            },
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}



// ================ Edit Course Details ================
exports.editCourse = async (req, res) => {
    let connection;
    try {
        const { courseId } = req.body;
        const updates = req.body;
        connection = await pool.getConnection();

        // Get course details
        const [courses] = await connection.execute(
            'SELECT * FROM courses WHERE id = ?',
            [courseId]
        );

        if (courses.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        const course = courses[0];

        // If Thumbnail Image is found, update it
        if (req.files) {
            const thumbnail = req.files.thumbnailImage;
            const thumbnailImage = await uploadImageToCloudinary(
                thumbnail,
                process.env.FOLDER_NAME
            );
            updates.thumbnail = thumbnailImage.secure_url;
        }

        // Prepare update data
        const allowedFields = [
            'courseName', 'courseDescription', 'whatYouWillLearn',
            'price', 'thumbnail', 'categoryId', 'tag', 'instructions', 'status'
        ];
        const updateFields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                values.push(key === 'tag' || key === 'instructions' ? JSON.stringify(value) : value);
            }
        }

        if (updateFields.length > 0) {
            values.push(courseId);
            const updateQuery = `
                UPDATE courses 
                SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            await connection.execute(updateQuery, values);
        }

        // Get updated course details
        const [updatedCourse] = await connection.execute(
            `SELECT c.*, 
                    u.firstName as instructorFirstName,
                    u.lastName as instructorLastName,
                    u.image as instructorImage,
                    cat.name as categoryName,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', s.id,
                            'sectionName', s.sectionName,
                            'subSections', (
                                SELECT JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'id', ss.id,
                                        'title', ss.title,
                                        'timeDuration', ss.timeDuration,
                                        'description', ss.description,
                                        'videoUrl', ss.videoUrl
                                    )
                                )
                                FROM subSections ss
                                WHERE ss.sectionId = s.id
                            )
                        )
                    ) as courseContent
             FROM courses c
             LEFT JOIN users u ON c.instructorId = u.id
             LEFT JOIN categories cat ON c.categoryId = cat.id
             LEFT JOIN sections s ON c.id = s.courseId
             WHERE c.id = ?
             GROUP BY c.id`,
            [courseId]
        );

        if (updatedCourse.length === 0) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Parse JSON fields
        const courseData = updatedCourse[0];
        if (courseData.tag) courseData.tag = JSON.parse(courseData.tag);
        if (courseData.instructions) courseData.instructions = JSON.parse(courseData.instructions);
        if (courseData.courseContent) courseData.courseContent = JSON.parse(courseData.courseContent);

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: courseData,
        });
    } catch (error) {
        console.error("Error while updating course:", error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while updating course",
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};



// ================ Get a list of Course for a given Instructor ================
exports.getInstructorCourses = async (req, res) => {
    try {
        // Get the instructor ID from the authenticated user
        const instructorId = req.user.id;

        // Find all courses belonging to the instructor
        const instructorCourses = await Course.findAll({ instructorId });

        // Return the instructor's courses
        res.status(200).json({
            success: true,
            data: instructorCourses,
            message: 'Courses made by Instructor fetched successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve instructor courses",
            error: error.message,
        });
    }
}



// ================ Delete the Course ================
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body;

        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Delete course thumbnail From Cloudinary
        await deleteResourceFromCloudinary(course?.thumbnail);

        // Delete sections and sub-sections
        const sections = await Section.findAll({ courseId });
        for (const section of sections) {
            // Delete sub-sections of the section
            const subSections = await SubSection.findAll({ sectionId: section.id });
            for (const subSection of subSections) {
                if (subSection.videoUrl) {
                    await deleteResourceFromCloudinary(subSection.videoUrl); // delete course videos From Cloudinary
                }
                await SubSection.delete(subSection.id);
            }

            // Delete the section
            await Section.delete(section.id);
        }

        // Delete the course
        await Course.delete(courseId);

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error while Deleting course",
            error: error.message,
        });
    }
}




