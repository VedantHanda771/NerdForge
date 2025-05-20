const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
    static async create(userData) {
        const id = uuidv4();
        const query = `
            INSERT INTO users (id, firstName, lastName, email, password, accountType, image)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            id,
            userData.firstName,
            userData.lastName,
            userData.email,
            userData.password,
            userData.accountType,
            userData.image
        ];

        try {
            const [result] = await pool.execute(query, values);
            return { id, ...userData };
        } catch (error) {
            throw error;
        }
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        try {
            const [rows] = await pool.execute(query, [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = ?';
        try {
            const [rows] = await pool.execute(query, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async updateToken(id, token, expires) {
        const query = `
            UPDATE users 
            SET token = ?, resetPasswordExpires = ?
            WHERE id = ?
        `;
        try {
            await pool.execute(query, [token, expires, id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async updatePassword(id, hashedPassword) {
        const query = `
            UPDATE users 
            SET password = ?, token = NULL, resetPasswordExpires = NULL
            WHERE id = ?
        `;
        try {
            await pool.execute(query, [hashedPassword, id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async updateImage(id, imageUrl) {
        const query = 'UPDATE users SET image = ? WHERE id = ?';
        try {
            await pool.execute(query, [imageUrl, id]);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;