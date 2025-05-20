const { pool } = require('../config/database');

async function updateToAdmin(email) {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await pool.getConnection();
        console.log('Connected successfully');
        
        // First, check if user exists
        console.log('Checking if user exists...');
        const [users] = await connection.execute(
            'SELECT id, accountType FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log('No user found with email:', email);
            return;
        }

        const user = users[0];
        console.log('Found user:', user);

        // Check if user is already an admin
        if (user.accountType === 'Admin') {
            console.log('User is already an admin');
            return;
        }

        // Start transaction
        await connection.beginTransaction();
        console.log('Started transaction');

        try {
            // Update user to admin
            console.log('Updating user to admin...');
            const [result] = await connection.execute(
                'UPDATE users SET accountType = ? WHERE email = ?',
                ['Admin', email]
            );

            if (result.affectedRows === 0) {
                throw new Error('No rows were updated');
            }

            // Commit transaction
            await connection.commit();
            console.log('Transaction committed');

            console.log('Successfully updated user to admin:', email);
            console.log('User can now access admin features');
        } catch (error) {
            // Rollback in case of error
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error updating user:', error);
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
    console.log('Please provide an email address as an argument');
    console.log('Usage: node updateToAdmin.js <email>');
    process.exit(1);
}

// Update the user to admin
console.log('Starting update process for email:', email);
updateToAdmin(email)
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });

// Add a timeout to prevent hanging
setTimeout(() => {
    console.log('Script timed out after 30 seconds');
    process.exit(1);
}, 30000); 