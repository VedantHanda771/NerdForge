const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class RatingAndReview {
    static async create({ userId, courseId, rating, review }) {
        const id = uuidv4();
        const query = `
            INSERT INTO ratingAndReviews (id, userId, course, rating, review)
            VALUES (?, ?, ?, ?, ?)
        `;
        try {
            await pool.execute(query, [id, userId, courseId, rating, review]);
            return { id, userId, courseId, rating, review };
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        const query = `
            SELECT r.*, 
                   u.firstName as userFirstName,
                   u.lastName as userLastName,
                   c.courseName
            FROM ratingAndReviews r
            JOIN users u ON r.userId = u.id
            JOIN courses c ON r.course = c.id
            WHERE r.id = ?
        `;
        try {
            const [rows] = await pool.execute(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByCourseId(courseId) {
        const query = `
            SELECT r.*, 
                   u.firstName as userFirstName,
                   u.lastName as userLastName
            FROM ratingAndReviews r
            JOIN users u ON r.userId = u.id
            WHERE r.course = ?
            ORDER BY r.createdAt DESC
        `;
        try {
            const [rows] = await pool.execute(query, [courseId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async findByUserId(userId) {
        const query = `
            SELECT r.*, 
                   c.courseName
            FROM ratingAndReviews r
            JOIN courses c ON r.course = c.id
            WHERE r.userId = ?
            ORDER BY r.createdAt DESC
        `;
        try {
            const [rows] = await pool.execute(query, [userId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, updateData) {
        const allowedFields = ['rating', 'review'];
        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            return null;
        }

        values.push(id);
        const query = `
            UPDATE ratingAndReviews 
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
        const query = 'DELETE FROM ratingAndReviews WHERE id = ?';
        try {
            await pool.execute(query, [id]);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = RatingAndReview;