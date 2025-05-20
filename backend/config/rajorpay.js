const Rajorpay = require('razorpay');
require('dotenv').config();

// Validate environment variables
if (!process.env.RAZORPAY_KEY || !process.env.RAZORPAY_SECRET) {
    console.error("Error: RAZORPAY_KEY and RAZORPAY_SECRET must be set in .env file");
    process.exit(1);
}

// Validate key format
if (!process.env.RAZORPAY_KEY.startsWith('rzp_test_')) {
    console.error("Error: RAZORPAY_KEY must start with 'rzp_test_' for test mode");
    process.exit(1);
}

console.log("Razorpay Key:", process.env.RAZORPAY_KEY);
console.log("Razorpay Secret:", process.env.RAZORPAY_SECRET ? "Set" : "Not Set");

try {
    exports.instance = new Rajorpay({
        key_id: process.env.RAZORPAY_KEY,
        key_secret: process.env.RAZORPAY_SECRET
    });
    console.log("Razorpay instance created successfully");
} catch (error) {
    console.error("Error creating Razorpay instance:", error.message);
    process.exit(1);
}