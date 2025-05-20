const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Category {
    static async create({ name, description }) {
        const id = uuidv4();
        const query = `
            INSERT INTO categories (id, name, description)
            VALUES (?, ?, ?)
        `;
        try {
            await pool.execute(query, [id, name, description]);
            return { id, name, description };
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        const query = `
            SELECT c.*, 
                   GROUP_CONCAT(co.id) as courseIds
            FROM categories c
            LEFT JOIN courses co ON c.id = co.categoryId
            WHERE c.id = ?
            GROUP BY c.id
        `;
        try {
            const [rows] = await pool.execute(query, [id]);
            if (rows[0]) {
                rows[0].courseIds = rows[0].courseIds ? rows[0].courseIds.split(',') : [];
            }
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findAll() {
        const query = `
            SELECT c.*, 
                   COUNT(co.id) as courseCount
            FROM categories c
            LEFT JOIN courses co ON c.id = co.categoryId
            GROUP BY c.id
            ORDER BY c.name
        `;
        try {
            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, updateData) {
        const allowedFields = ['name', 'description'];
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
            UPDATE categories 
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
        const query = 'DELETE FROM categories WHERE id = ?';
        try {
            await pool.execute(query, [id]);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Category;