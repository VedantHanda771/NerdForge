const Section = require('../models/section');
const SubSection = require('../models/subSection');
const Course = require('../models/course');
const { pool } = require('../config/database');
const { uploadImageToCloudinary } = require('../utils/imageUploader');
const { v4: uuidv4 } = require('uuid');



// ================ create SubSection ================
exports.createSubSection = async (req, res) => {
    let connection;
    try {
        // extract data
        const { title, description, sectionId } = req.body;

        // extract video file
        const videoFile = req.files.video;

        // validation
        if (!title || !description || !videoFile || !sectionId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        connection = await pool.getConnection();

        // upload video to cloudinary
        const videoFileDetails = await uploadImageToCloudinary(videoFile, process.env.FOLDER_NAME);

        // Create subsection
        const subSectionId = uuidv4();
        const createSubSectionQuery = `
            INSERT INTO subSections (id, title, timeDuration, description, videoUrl, sectionId)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await connection.execute(createSubSectionQuery, [
            subSectionId,
            title,
            videoFileDetails.duration,
            description,
            videoFileDetails.secure_url,
            sectionId
        ]);

        // Get updated section with subsections
        const [updatedSection] = await connection.execute(
            `SELECT s.*, 
                    COALESCE(
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', ss.id,
                                'title', ss.title,
                                'timeDuration', ss.timeDuration,
                                'description', ss.description,
                                'videoUrl', ss.videoUrl
                            )
                        ),
                        JSON_ARRAY()
                    ) as subSections
             FROM sections s
             LEFT JOIN subSections ss ON s.id = ss.sectionId
             WHERE s.id = ?
             GROUP BY s.id`,
            [sectionId]
        );

        if (updatedSection.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        // Parse the JSON string in subSections
        const section = updatedSection[0];
        try {
            if (section.subSections && typeof section.subSections === 'string') {
                section.subSections = JSON.parse(section.subSections);
            }
        } catch (parseError) {
            console.log('Error parsing JSON:', parseError);
            section.subSections = [];
        }

        // Get updated course details
        const [courseDetails] = await connection.execute(
            `SELECT c.*, 
                    COALESCE(
                        JSON_ARRAYAGG(
                            CASE 
                                WHEN s.id IS NOT NULL THEN
                                    JSON_OBJECT(
                                        'id', s.id,
                                        'sectionName', s.sectionName,
                                        'subSections', COALESCE(
                                            (
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
                                            ),
                                            JSON_ARRAY()
                                        )
                                    )
                                ELSE NULL
                            END
                        ),
                        JSON_ARRAY()
                    ) as courseContent
             FROM courses c
             LEFT JOIN sections s ON c.id = s.courseId
             WHERE c.id = (SELECT courseId FROM sections WHERE id = ?)
             GROUP BY c.id`,
            [sectionId]
        );

        if (courseDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Parse the JSON strings
        const course = courseDetails[0];
        try {
            if (course.courseContent && typeof course.courseContent === 'string') {
                course.courseContent = JSON.parse(course.courseContent);
            }
            if (course.tag && typeof course.tag === 'string') {
                course.tag = JSON.parse(course.tag);
            }
            if (course.instructions && typeof course.instructions === 'string') {
                course.instructions = JSON.parse(course.instructions);
            }
        } catch (parseError) {
            console.log('Error parsing JSON:', parseError);
        }

        res.status(200).json({
            success: true,
            data: course,
            message: 'SubSection created successfully'
        });
    } catch (error) {
        console.log('Error while creating SubSection');
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while creating SubSection'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};



// ================ Update SubSection ================
exports.updateSubSection = async (req, res) => {
    let connection;
    try {
        const { sectionId, subSectionId, title, description } = req.body;

        // validation
        if (!subSectionId) {
            return res.status(400).json({
                success: false,
                message: 'subSection ID is required to update'
            });
        }

        connection = await pool.getConnection();

        // find in DB
        const [subSections] = await connection.execute(
            'SELECT * FROM subSections WHERE id = ?',
            [subSectionId]
        );

        if (subSections.length === 0) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            });
        }

        const subSection = subSections[0];

        // Prepare update data
        const updates = [];
        const values = [];

        if (title) {
            updates.push('title = ?');
            values.push(title);
        }

        if (description) {
            updates.push('description = ?');
            values.push(description);
        }

        // upload video to cloudinary
        if (req.files && req.files.videoFile !== undefined) {
            const video = req.files.videoFile;
            const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
            updates.push('videoUrl = ?');
            updates.push('timeDuration = ?');
            values.push(uploadDetails.secure_url);
            values.push(uploadDetails.duration);
        }

        if (updates.length > 0) {
            values.push(subSectionId);
            const updateQuery = `
                UPDATE subSections 
                SET ${updates.join(', ')}
                WHERE id = ?
            `;
            await connection.execute(updateQuery, values);
        }

        // Get updated section with subsections
        const [updatedSection] = await connection.execute(
            `SELECT s.*, 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', ss.id,
                            'title', ss.title,
                            'timeDuration', ss.timeDuration,
                            'description', ss.description,
                            'videoUrl', ss.videoUrl
                        )
                    ) as subSections
             FROM sections s
             LEFT JOIN subSections ss ON s.id = ss.sectionId
             WHERE s.id = ?
             GROUP BY s.id`,
            [sectionId]
        );

        if (updatedSection.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Section not found",
            });
        }

        // Parse the JSON string in subSections
        const section = updatedSection[0];
        if (section.subSections) {
            section.subSections = JSON.parse(section.subSections);
        }

        return res.json({
            success: true,
            data: section,
            message: "Section updated successfully",
        });
    } catch (error) {
        console.error('Error while updating the section');
        console.error(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while updating the section",
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};



// ================ Delete SubSection ================
exports.deleteSubSection = async (req, res) => {
    let connection;
    try {
        const { subSectionId, sectionId } = req.body;

        connection = await pool.getConnection();

        // Delete the subsection
        const [deleteResult] = await connection.execute(
            'DELETE FROM subSections WHERE id = ?',
            [subSectionId]
        );

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found"
            });
        }

        // Get updated section with subsections
        const [updatedSection] = await connection.execute(
            `SELECT s.*, 
                    COALESCE(
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', ss.id,
                                'title', ss.title,
                                'timeDuration', ss.timeDuration,
                                'description', ss.description,
                                'videoUrl', ss.videoUrl
                            )
                        ),
                        JSON_ARRAY()
                    ) as subSections
             FROM sections s
             LEFT JOIN subSections ss ON s.id = ss.sectionId
             WHERE s.id = ?
             GROUP BY s.id`,
            [sectionId]
        );

        if (updatedSection.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        // Parse the JSON string in subSections
        const section = updatedSection[0];
        try {
            if (section.subSections && typeof section.subSections === 'string') {
                section.subSections = JSON.parse(section.subSections);
            }
        } catch (parseError) {
            console.log('Error parsing JSON:', parseError);
            section.subSections = [];
        }

        return res.json({
            success: true,
            data: section,
            message: "SubSection deleted successfully"
        });
    } catch (error) {
        console.error('Error while deleting the SubSection:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "An error occurred while deleting the SubSection"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};