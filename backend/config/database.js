const mysql = require('mysql2/promise');
require('dotenv').config();

// Log database configuration (without sensitive data)
console.log('Database Configuration:');
console.log('Host:', process.env.DB_HOST || 'localhost');
console.log('User:', process.env.DB_USER || 'root');
console.log('Database:', process.env.DB_NAME || 'study_notion');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'study_notion',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

exports.connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
    } catch (error) {
        console.log('Error while connecting to Database');
        console.log(error);
        process.exit(1);
    }
};

exports.pool = pool;

