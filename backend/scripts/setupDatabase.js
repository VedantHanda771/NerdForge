const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    try {
        // First, connect without database to create it if it doesn't exist
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'study_notion'}`);
        console.log('Database created or already exists');

        // Switch to the database
        await connection.query(`USE ${process.env.DB_NAME || 'study_notion'}`);

        // Create users table
        await connection.query(`
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
        console.log('Users table created or already exists');

        // Create profiles table
        await connection.query(`
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
        console.log('Profiles table created or already exists');

        // Create categories table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Categories table created or already exists');

        // Create courses table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS courses (
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
        console.log('Courses table created or already exists');

        // Verify tables exist and show their structure
        const tables = ['users', 'profiles', 'categories', 'courses'];
        for (const table of tables) {
            const [rows] = await connection.query(`DESCRIBE ${table}`);
            console.log(`\nStructure of ${table} table:`);
            console.table(rows);
        }

        // Check if there's any data in the tables
        for (const table of tables) {
            const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`\nNumber of records in ${table}: ${rows[0].count}`);
        }

    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
        process.exit();
    }
}

setupDatabase(); 