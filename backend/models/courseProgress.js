const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class CourseProgress {
    static async create({ courseId, userId }) {
        const id = uuidv4();
        const query = `
            INSERT INTO courseProgress (id, courseId, userId, completedVideos)
            VALUES (?, ?, ?, '[]')
        `;
        try {
            await pool.execute(query, [id, courseId, userId]);
            return { id, courseId, userId, completedVideos: [] };
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        const query = `
            SELECT cp.*, 
                   c.courseName,
                   u.firstName as userFirstName,
                   u.lastName as userLastName
            FROM courseProgress cp
            JOIN courses c ON cp.courseId = c.id
            JOIN users u ON cp.userId = u.id
            WHERE cp.id = ?
        `;
        try {
            const [rows] = await pool.execute(query, [id]);
            if (rows[0]) {
                rows[0].completedVideos = JSON.parse(rows[0].completedVideos || '[]');
            }
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByUserId(userId) {
        const query = `
            SELECT cp.*, 
                   c.courseName,
                   c.thumbnail,
                   c.instructorId,
                   u.firstName as instructorFirstName,
                   u.lastName as instructorLastName
            FROM courseProgress cp
            JOIN courses c ON cp.courseId = c.id
            JOIN users u ON c.instructorId = u.id
            WHERE cp.userId = ?
            ORDER BY cp.updatedAt DESC
        `;
        try {
            const [rows] = await pool.execute(query, [userId]);
            return rows.map(row => ({
                ...row,
                completedVideos: JSON.parse(row.completedVideos || '[]')
            }));
        } catch (error) {
            throw error;
        }
    }

    static async findByCourseId(courseId) {
        const query = `
            SELECT cp.*, 
                   u.firstName,
                   u.lastName,
                   u.email
            FROM courseProgress cp
            JOIN users u ON cp.userId = u.id
            WHERE cp.courseId = ?
            ORDER BY cp.updatedAt DESC
        `;
        try {
            const [rows] = await pool.execute(query, [courseId]);
            return rows.map(row => ({
                ...row,
                completedVideos: JSON.parse(row.completedVideos || '[]')
            }));
        } catch (error) {
            throw error;
        }
    }

    static async updateCompletedVideos(id, completedVideos) {
        const query = `
            UPDATE courseProgress 
            SET completedVideos = ?
            WHERE id = ?
        `;
        try {
            await pool.execute(query, [JSON.stringify(completedVideos), id]);
            return this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    static async addCompletedVideo(id, videoId) {
        const query = `
            UPDATE courseProgress 
            SET completedVideos = JSON_ARRAY_APPEND(
                COALESCE(completedVideos, JSON_ARRAY()),
                '$',
                ?
            )
            WHERE id = ?
        `;
        try {
            await pool.execute(query, [videoId, id]);
            return this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    static async removeCompletedVideo(id, videoId) {
        const query = `
            UPDATE courseProgress 
            SET completedVideos = JSON_REMOVE(
                completedVideos,
                JSON_SEARCH(completedVideos, 'one', ?)
            )
            WHERE id = ?
        `;
        try {
            await pool.execute(query, [videoId, id]);
            return this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        const query = 'DELETE FROM courseProgress WHERE id = ?';
        try {
            await pool.execute(query, [id]);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = CourseProgress;

