const express = require('express')
const app = express();
const bcrypt = require('bcrypt');

// packages
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

// connection to DB and cloudinary
const { connectDB } = require('./config/database');
const { cloudinaryConnect } = require('./config/cloudinary');
const initializeDatabase = require('./scripts/initDb');

// routes
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const paymentRoutes = require('./routes/payments');
const courseRoutes = require('./routes/course');

// middleware 
app.use(express.json()); // to parse json body
app.use(cookieParser());

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: '/tmp'
    })
)

// mount routes
app.use('/api/v1/auth', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/course', courseRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

// Initialize server
const startServer = async () => {
    try {
        // Initialize database first
        await initializeDatabase();
        console.log('Database initialized');
        
        // Then connect to database
        await connectDB();
        console.log('Database connected');
        
        // Connect to cloudinary
        cloudinaryConnect();
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server Started on PORT ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

const { v4: uuidv4 } = require('uuid');
console.log(uuidv4());

// (async () => {
//     const plainPassword = 'Anonymus@123'; 
//     const hashedPassword = await bcrypt.hash(plainPassword, 10);
//     console.log('Hashed Password:', hashedPassword);
// })();
