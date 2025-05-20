const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function createOrUpdateAdmin(email) {
    let connection;

    try {
        console.log('Connecting to database...');
        connection = await pool.getConnection();
        console.log('Connected successfully');

        // Check if user already exists
        console.log('Checking if user exists...');
        const [existingUsers] = await connection.execute(
            'SELECT id, accountType FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            console.log(`User already exists with accountType: ${existingUser.accountType}`);

            // Only update if not already admin
            if (existingUser.accountType !== 'Admin') {
                await connection.execute(
                    'UPDATE users SET accountType = ? WHERE email = ?',
                    ['Admin', email]
                );
                console.log('✅ Updated existing user to Admin');
            } else {
                console.log('ℹ️ User is already an Admin. No changes made.');
            }

            return;
        }

        // Generate a default password
        const defaultPassword = 'Admin@123';
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Create new user
        const userId = uuidv4();
        console.log('Creating new admin user...');
        const [userResult] = await connection.execute(
            `INSERT INTO users (
                id, email, password, firstName, lastName, accountType
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, email, hashedPassword, 'Admin', 'User', 'Admin']
        );

        if (userResult.affectedRows !== 1) {
            throw new Error('Failed to create user');
        }

        // Create profile
        const profileId = uuidv4();
        console.log('Creating profile...');
        const [profileResult] = await connection.execute(
            `INSERT INTO profiles (
                id, gender, dateOfBirth, about, contactNumber, userId
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [profileId, null, null, null, null, userId]
        );

        if (profileResult.affectedRows !== 1) {
            throw new Error('Failed to create profile');
        }

        console.log('\n✅ Successfully created new admin user:');
        console.log('Email:', email);
        console.log('Password:', defaultPassword);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        if (connection) {
            console.log('Releasing database connection...');
            connection.release();
        }
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('❗ Please provide an email address as an argument');
    console.log('Usage: node createAdmin.js <email>');
    process.exit(1);
}

console.log('Starting admin creation or update process for email:', email);
createOrUpdateAdmin(email)
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    });

// Safety timeout
setTimeout(() => {
    console.error('❌ Script timed out after 30 seconds');
    process.exit(1);
}, 30000);
