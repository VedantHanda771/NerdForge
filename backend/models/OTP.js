const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const mailSender = require('../utils/mailSender');

class OTP {
    static async create({ email, otp }) {
        const id = uuidv4();
        const query = `
            INSERT INTO otps (id, email, otp, expiresAt)
            VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
        `;
        try {
            await pool.execute(query, [id, email, otp]);
            await this.sendVerificationEmail(email, otp);
            return { id, email, otp };
        } catch (error) {
            throw error;
        }
    }

    static async findMostRecent(email) {
        const query = `
            SELECT * FROM otps 
            WHERE email = ? 
            AND expiresAt > NOW()
            ORDER BY createdAt DESC 
            LIMIT 1
        `;
        try {
            const [rows] = await pool.execute(query, [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async deleteExpired() {
        const query = 'DELETE FROM otps WHERE expiresAt <= NOW()';
        try {
            await pool.execute(query);
        } catch (error) {
            throw error;
        }
    }

    static async sendVerificationEmail(email, otp) {
        try {
            await mailSender(email, 'Verification Email from StudyNotion', otp);
            console.log('Email sent successfully to - ', email);
        } catch (error) {
            console.log('Error while sending an email to ', email);
            throw error;
        }
    }
}

// Set up a periodic cleanup of expired OTPs
setInterval(() => {
    OTP.deleteExpired().catch(console.error);
}, 5 * 60 * 1000); // Run every 5 minutes

module.exports = OTP;