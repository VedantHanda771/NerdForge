const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Profile {
    static async create({ gender, dateOfBirth, about, contactNumber, userId }) {
        const id = uuidv4();
        const query = `
            INSERT INTO profiles (id, gender, dateOfBirth, about, contactNumber, userId)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        try {
            await pool.execute(query, [id, gender, dateOfBirth, about, contactNumber, userId]);
            return { id, gender, dateOfBirth, about, contactNumber, userId };
        } catch (error) {
            throw error;
        }
    }

    static async findByUserId(userId) {
        const query = 'SELECT * FROM profiles WHERE userId = ?';
        try {
            const [rows] = await pool.execute(query, [userId]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async update(userId, updateData) {
        const allowedFields = ['gender', 'dateOfBirth', 'about', 'contactNumber'];
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

        values.push(userId);
        const query = `
            UPDATE profiles 
            SET ${updates.join(', ')}
            WHERE userId = ?
        `;

        try {
            await pool.execute(query, values);
            return this.findByUserId(userId);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Profile;