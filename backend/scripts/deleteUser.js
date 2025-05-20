const { pool } = require('../config/database');

async function deleteUser(email) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // First, get the user's ID
        const [users] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log('No user found with email:', email);
            return;
        }

        const userId = users[0].id;

        // Start transaction
        await connection.beginTransaction();

        try {
            // Delete from profiles (due to foreign key constraint)
            await connection.execute(
                'DELETE FROM profiles WHERE userId = ?',
                [userId]
            );
            console.log('Deleted profile for user:', email);

            // Delete from users
            await connection.execute(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );
            console.log('Deleted user:', email);

            // Commit transaction
            await connection.commit();
            console.log('User deletion completed successfully');

        } catch (error) {
            // Rollback in case of error
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        if (connection) {
            connection.release();
        }
        process.exit();
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Please provide an email address as an argument');
    console.log('Usage: node deleteUser.js <email>');
    process.exit(1);
}

// Delete the user with the provided email
deleteUser(email); 