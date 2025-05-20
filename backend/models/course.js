const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Course {
    static async create({ courseName, courseDescription, instructorId, whatYouWillLearn, price, thumbnail, categoryId, tag, instructions, status }) {
        const id = uuidv4();
        const query = `
            INSERT INTO courses (
                id, courseName, courseDescription, instructorId, whatYouWillLearn,
                price, thumbnail, categoryId, tag, instructions, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            id, courseName, courseDescription, instructorId, whatYouWillLearn,
            price, thumbnail, categoryId, 
            typeof tag === 'string' ? tag : JSON.stringify(tag),
            typeof instructions === 'string' ? instructions : JSON.stringify(instructions),
            status
        ];

        try {
            await pool.execute(query, values);
            return { 
                id, 
                courseName, 
                courseDescription, 
                instructorId, 
                whatYouWillLearn, 
                price, 
                thumbnail, 
                categoryId, 
                tag, 
                instructions, 
                status,
                courseContent: []
            };
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        const query = `
            SELECT c.*, 
                   GROUP_CONCAT(DISTINCT s.id) as sectionIds,
                   GROUP_CONCAT(DISTINCT r.id) as ratingAndReviewIds,
                   GROUP_CONCAT(DISTINCT cp.userId) as enrolledStudentIds,
                   u.firstName as instructorFirstName,
                   u.lastName as instructorLastName,
                   u.image as instructorImage,
                   cat.name as categoryName,
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
            LEFT JOIN ratingAndReviews r ON c.id = r.course
            LEFT JOIN courseProgress cp ON c.id = cp.courseId
            LEFT JOIN users u ON c.instructorId = u.id
            LEFT JOIN categories cat ON c.categoryId = cat.id
            WHERE c.id = ?
            GROUP BY c.id
        `;
        try {
            const [rows] = await pool.execute(query, [id]);
            if (rows[0]) {
                rows[0].tag = JSON.parse(rows[0].tag || '[]');
                rows[0].instructions = JSON.parse(rows[0].instructions || '[]');
                rows[0].sectionIds = rows[0].sectionIds ? rows[0].sectionIds.split(',') : [];
                rows[0].ratingAndReviewIds = rows[0].ratingAndReviewIds ? rows[0].ratingAndReviewIds.split(',') : [];
                rows[0].enrolledStudentIds = rows[0].enrolledStudentIds ? rows[0].enrolledStudentIds.split(',') : [];
                rows[0].courseContent = rows[0].courseContent ? JSON.parse(rows[0].courseContent) : [];
            }
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findAll(filters = {}) {
        let query = `
            SELECT c.*, 
                   COUNT(DISTINCT cp.userId) as enrolledStudents,
                   AVG(CAST(r.rating AS DECIMAL(3,1))) as averageRating,
                   u.firstName as instructorFirstName,
                   u.lastName as instructorLastName,
                   cat.name as categoryName
            FROM courses c
            LEFT JOIN courseProgress cp ON c.id = cp.courseId
            LEFT JOIN ratingAndReviews r ON c.id = r.course
            LEFT JOIN users u ON c.instructorId = u.id
            LEFT JOIN categories cat ON c.categoryId = cat.id
        `;

        const values = [];
        const conditions = [];

        if (filters.categoryId) {
            conditions.push('c.categoryId = ?');
            values.push(filters.categoryId);
        }

        if (filters.instructorId) {
            conditions.push('c.instructorId = ?');
            values.push(filters.instructorId);
        }

        if (filters.status) {
            conditions.push('c.status = ?');
            values.push(filters.status);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY c.id ORDER BY c.createdAt DESC';

        try {
            const [rows] = await pool.execute(query, values);
            return rows.map(row => ({
                ...row,
                tag: JSON.parse(row.tag || '[]'),
                instructions: JSON.parse(row.instructions || '[]')
            }));
        } catch (error) {
            throw error;
        }
    }

    static async update(id, updateData) {
        const allowedFields = [
            'courseName', 'courseDescription', 'whatYouWillLearn',
            'price', 'thumbnail', 'categoryId', 'tag', 'instructions', 'status'
        ];
        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                values.push(key === 'tag' || key === 'instructions' ? JSON.stringify(value) : value);
            }
        }

        if (updates.length === 0) {
            return null;
        }

        values.push(id);
        const query = `
            UPDATE courses 
            SET ${updates.join(', ')}
            WHERE id = ?
        `;

        try {
            await pool.execute(query, values);
            return this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        const query = 'DELETE FROM courses WHERE id = ?';
        try {
            await pool.execute(query, [id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async enrollStudent(courseId, userId) {
        const query = `
            INSERT INTO courseProgress (id, courseId, userId, completedVideos)
            VALUES (?, ?, ?, '[]')
            ON DUPLICATE KEY UPDATE courseId = courseId
        `;
        try {
            await pool.execute(query, [uuidv4(), courseId, userId]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async unenrollStudent(courseId, userId) {
        const query = 'DELETE FROM courseProgress WHERE courseId = ? AND userId = ?';
        try {
            await pool.execute(query, [courseId, userId]);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Course;