const { pool } = require('../config/database');

async function listAdmins() {
    try {
        const query = `
            SELECT u.id, u.firstName, u.lastName, u.email, u.accountType, u.createdAt,
                   p.contactNumber, p.gender
            FROM users u
            LEFT JOIN profiles p ON u.id = p.userId
            WHERE u.accountType = 'Admin'
        `;

        const [admins] = await pool.execute(query);
        
        if (admins.length === 0) {
            console.log('No admin users found');
            return;
        }

        console.log('\nAdmin Users:');
        console.table(admins.map(admin => ({
            'ID': admin.id,
            'Name': `${admin.firstName} ${admin.lastName}`,
            'Email': admin.email,
            'Account Type': admin.accountType,
            'Contact': admin.contactNumber || 'Not set',
            'Gender': admin.gender || 'Not set',
            'Created At': admin.createdAt
        })));

    } catch (error) {
        console.error('Error listing admins:', error);
    } finally {
        process.exit();
    }
}

listAdmins(); 