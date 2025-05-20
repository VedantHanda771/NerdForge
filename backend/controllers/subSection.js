const Section = require('../models/section');
const SubSection = require('../models/subSection');
const Course = require('../models/course');
const { pool } = require('../config/database');
const { uploadImageToCloudinary } = require('../utils/imageUploader');



// ================ create SubSection ================
exports.createSubSection = async (req, res) => {
    try {
        // extract data
        const { title, description, sectionId } = req.body;

        // extract video file
        const videoFile = req.files.video
        // console.log('videoFile ', videoFile)

        // validation
        if (!title || !description || !videoFile || !sectionId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            })
        }

        // upload video to cloudinary
        const videoFileDetails = await uploadImageToCloudinary(videoFile, process.env.FOLDER_NAME);

        // create entry in DB
        const SubSectionDetails = await SubSection.create(
            { title, timeDuration: videoFileDetails.duration, description, videoUrl: videoFileDetails.secure_url })

        // link subsection id to section
        // Update the corresponding section with the newly created sub-section
        const updatedSection = await Section.findByIdAndUpdate(
            { _id: sectionId },
            { $push: { subSection: SubSectionDetails._id } },
            { new: true }
        ).populate("subSection")

        // return response
        res.status(200).json({
            success: true,
            data: updatedSection,
            message: 'SubSection created successfully'
        });
    }
    catch (error) {
        console.log('Error while creating SubSection');
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while creating SubSection'
        })
    }
}



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
    try {
        const { subSectionId, sectionId } = req.body
        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )

        // delete from DB
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

        if (!subSection) {
            return res
                .status(404)
                .json({ success: false, message: "SubSection not found" })
        }

        const updatedSection = await Section.findById(sectionId).populate('subSection')

        // In frontned we have to take care - when subsection is deleted we are sending ,
        // only section data not full course details as we do in others 

        // success response
        return res.json({
            success: true,
            data: updatedSection,
            message: "SubSection deleted successfully",
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,

            error: error.message,
            message: "An error occurred while deleting the SubSection",
        })
    }
}