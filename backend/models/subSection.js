const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class SubSection {
    static async create({ title, timeDuration, description, videoUrl, sectionId }) {
        const id = uuidv4();
        const query = `
            INSERT INTO subSections (id, title, timeDuration, description, videoUrl, sectionId)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        try {
            await pool.execute(query, [id, title, timeDuration, description, videoUrl, sectionId]);
            return { id, title, timeDuration, description, videoUrl, sectionId };
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        const query = 'SELECT * FROM subSections WHERE id = ?';
        try {
            const [rows] = await pool.execute(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findBySectionId(sectionId) {
        const query = 'SELECT * FROM subSections WHERE sectionId = ? ORDER BY createdAt';
        try {
            const [rows] = await pool.execute(query, [sectionId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, updateData) {
        const allowedFields = ['title', 'timeDuration', 'description', 'videoUrl'];
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
            UPDATE subSections 
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
        const query = 'DELETE FROM subSections WHERE id = ?';
        try {
            await pool.execute(query, [id]);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = SubSection; 