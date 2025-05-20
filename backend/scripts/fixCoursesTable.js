const { pool } = require('../config/database');

async function fixCoursesTable() {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Drop the existing courses table
        await connection.query('DROP TABLE IF EXISTS courses');
        console.log('Dropped existing courses table');

        // Create the courses table with the correct structure
        await connection.query(`
            CREATE TABLE courses (
                id VARCHAR(36) PRIMARY KEY,
                courseName VARCHAR(255) NOT NULL,
                courseDescription TEXT,
                instructorId VARCHAR(36) NOT NULL,
                whatYouWillLearn TEXT,
                price DECIMAL(10,2) NOT NULL,
                thumbnail VARCHAR(255),
                categoryId VARCHAR(36),
                tag TEXT,
                instructions TEXT,
                status ENUM('Draft', 'Published') DEFAULT 'Draft',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (instructorId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
            )
        `);
        console.log('Created new courses table with correct structure');

        // Verify the table structure
        const [columns] = await connection.query('DESCRIBE courses');
        console.log('\nNew courses table structure:');
        console.table(columns);

    } catch (error) {
        console.error('Error fixing courses table:', error);
    } finally {
        if (connection) {
            connection.release();
        }
        process.exit();
    }
}

fixCoursesTable(); 