const Course = require('../models/course');
const Section = require('../models/section');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// ================ create Section ================
exports.createSection = async (req, res) => {
    let connection;
    try {
        // extract data 
        const { sectionName, courseId } = req.body;

        // validation
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            })
        }

        connection = await pool.getConnection();

        // Create new section
        const sectionId = uuidv4();
        const createSectionQuery = `
            INSERT INTO sections (id, sectionName, courseId)
            VALUES (?, ?, ?)
        `;
        await connection.execute(createSectionQuery, [sectionId, sectionName, courseId]);

        // Get updated course details with sections and subsections
        const [courseDetails] = await connection.execute(
            `SELECT c.*, 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', s.id,
                            'sectionName', s.sectionName,
                            'subSection', (
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
             LEFT JOIN sections s ON c.id = s.courseId
             WHERE c.id = ?
             GROUP BY c.id`,
            [courseId]
        );

        if (courseDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Parse the JSON strings
        const course = courseDetails[0];
        if (course.courseContent) {
            course.courseContent = JSON.parse(course.courseContent);
        }
        if (course.tag) {
            course.tag = JSON.parse(course.tag);
        }
        if (course.instructions) {
            course.instructions = JSON.parse(course.instructions);
        }

        res.status(200).json({
            success: true,
            data: course,
            message: 'Section created successfully'
        });
    } catch (error) {
        console.log('Error while creating section');
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while creating section'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}


// ================ update Section ================
exports.updateSection = async (req, res) => {
    let connection;
    try {
        // extract data
        const { sectionName, sectionId, courseId } = req.body;

        // validation
        if (!sectionId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        connection = await pool.getConnection();

        // Update section name in DB
        const updateQuery = 'UPDATE sections SET sectionName = ? WHERE id = ?';
        await connection.execute(updateQuery, [sectionName, sectionId]);

        // Get updated course details with sections and subsections
        const [courseDetails] = await connection.execute(
            `SELECT c.*, 
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
             LEFT JOIN sections s ON c.id = s.courseId
             WHERE c.id = ?
             GROUP BY c.id`,
            [courseId]
        );

        if (courseDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Parse the JSON strings in courseContent
        const course = courseDetails[0];
        if (course.courseContent) {
            course.courseContent = JSON.parse(course.courseContent);
        }

        res.status(200).json({
            success: true,
            data: course,
            message: 'Section updated successfully'
        });
    } catch (error) {
        console.log('Error while updating section');
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while updating section'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};



// ================ Delete Section ================
exports.deleteSection = async (req, res) => {
    try {
        const { sectionId, courseId } = req.body;
        // console.log('sectionId = ', sectionId);

        // delete section by id from DB
        await Section.findByIdAndDelete(sectionId);

        const updatedCourseDetails = await Course.findById(courseId)
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection'
                }
            })

        res.status(200).json({
            success: true,
            data: updatedCourseDetails,
            message: 'Section deleted successfully'
        })
    }
    catch (error) {
        console.log('Error while deleting section');
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while deleting section'
        })
    }
}

