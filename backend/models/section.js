const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Section {
    static async create({ sectionName, courseId }) {
        const id = uuidv4();
        const query = `
            INSERT INTO sections (id, sectionName, courseId)
            VALUES (?, ?, ?)
        `;
        try {
            await pool.execute(query, [id, sectionName, courseId]);
            return { id, sectionName, courseId };
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        const query = `
            SELECT s.*, 
                   GROUP_CONCAT(ss.id) as subSectionIds
            FROM sections s
            LEFT JOIN subSections ss ON s.id = ss.sectionId
            WHERE s.id = ?
            GROUP BY s.id
        `;
        try {
            const [rows] = await pool.execute(query, [id]);
            if (rows[0]) {
                rows[0].subSectionIds = rows[0].subSectionIds ? rows[0].subSectionIds.split(',') : [];
            }
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByCourseId(courseId) {
        const query = `
            SELECT s.*, 
                   GROUP_CONCAT(ss.id) as subSectionIds
            FROM sections s
            LEFT JOIN subSections ss ON s.id = ss.sectionId
            WHERE s.courseId = ?
            GROUP BY s.id
            ORDER BY s.createdAt
        `;
        try {
            const [rows] = await pool.execute(query, [courseId]);
            return rows.map(row => ({
                ...row,
                subSectionIds: row.subSectionIds ? row.subSectionIds.split(',') : []
            }));
        } catch (error) {
            throw error;
        }
    }

    static async update(id, updateData) {
        const allowedFields = ['sectionName'];
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
            UPDATE sections 
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
        const query = 'DELETE FROM sections WHERE id = ?';
        try {
            await pool.execute(query, [id]);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Section;
