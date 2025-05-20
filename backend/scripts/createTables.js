const { pool } = require('../config/database');

async function createTables() {
    try {
        // Create users table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                firstName VARCHAR(255) NOT NULL,
                lastName VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                accountType ENUM('Student', 'Instructor', 'Admin') NOT NULL,
                image VARCHAR(255),
                token VARCHAR(255),
                resetPasswordExpires DATETIME,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create profiles table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS profiles (
                id VARCHAR(36) PRIMARY KEY,
                gender ENUM('Male', 'Female', 'Other'),
                dateOfBirth DATE,
                about TEXT,
                contactNumber VARCHAR(20),
                userId VARCHAR(36) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create categories table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS categories (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create courses table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS courses (
                id VARCHAR(36) PRIMARY KEY,
                courseName VARCHAR(255) NOT NULL,
                courseDescription TEXT,
                instructorId VARCHAR(36) NOT NULL,
                whatYouWillLearn TEXT,
                price DECIMAL(10,2) NOT NULL,
                thumbnail VARCHAR(255),
                categoryId VARCHAR(36),
                tag JSON,
                instructions JSON,
                status ENUM('Draft', 'Published') DEFAULT 'Draft',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (instructorId) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
            )
        `);

        console.log('All tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        process.exit();
    }
}

createTables(); 