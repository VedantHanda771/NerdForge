const Category = require('../models/category');
const Course = require('../models/course');
const { v4: uuidv4 } = require('uuid');

// Dummy instructor ID (you should replace this with a real instructor ID from your database)
const INSTRUCTOR_ID = '00000000-0000-0000-0000-000000000001';

const categories = [
    {
        name: 'Web Development',
        description: 'Learn modern web development technologies and frameworks'
    },
    {
        name: 'Mobile Development',
        description: 'Master mobile app development for iOS and Android'
    },
    {
        name: 'Data Science',
        description: 'Explore data analysis, machine learning, and AI'
    },
    {
        name: 'Digital Marketing',
        description: 'Learn SEO, social media marketing, and content strategy'
    },
    {
        name: 'Business & Finance',
        description: 'Courses on entrepreneurship, finance, and business management'
    }
];

const courses = [
    {
        courseName: 'Complete Web Development Bootcamp',
        courseDescription: 'Master web development from scratch. Learn HTML, CSS, JavaScript, React, Node.js, and more.',
        instructorId: INSTRUCTOR_ID,
        whatYouWillLearn: 'HTML5, CSS3, JavaScript, React, Node.js, MongoDB, Express.js',
        price: 99.99,
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
        categoryId: null, // Will be set after category creation
        tag: ['beginner', 'web development', 'full-stack'],
        instructions: [
            'Basic computer knowledge',
            'No prior programming experience needed',
            'Dedication to learn'
        ],
        status: 'Published'
    },
    {
        courseName: 'iOS App Development with Swift',
        courseDescription: 'Learn to build iOS applications using Swift and Xcode',
        instructorId: INSTRUCTOR_ID,
        whatYouWillLearn: 'Swift, iOS SDK, Xcode, UIKit, SwiftUI',
        price: 129.99,
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
        categoryId: null,
        tag: ['mobile', 'iOS', 'Swift'],
        instructions: [
            'Mac computer required',
            'Basic programming knowledge',
            'Xcode installed'
        ],
        status: 'Published'
    },
    {
        courseName: 'Machine Learning Fundamentals',
        courseDescription: 'Introduction to machine learning algorithms and data analysis',
        instructorId: INSTRUCTOR_ID,
        whatYouWillLearn: 'Python, NumPy, Pandas, Scikit-learn, TensorFlow',
        price: 149.99,
        thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb',
        categoryId: null,
        tag: ['data science', 'machine learning', 'python'],
        instructions: [
            'Basic Python knowledge',
            'Understanding of statistics',
            'Linear algebra basics'
        ],
        status: 'Published'
    },
    {
        courseName: 'Digital Marketing Masterclass',
        courseDescription: 'Comprehensive course covering all aspects of digital marketing',
        instructorId: INSTRUCTOR_ID,
        whatYouWillLearn: 'SEO, Social Media Marketing, Content Marketing, Email Marketing',
        price: 79.99,
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
        categoryId: null,
        tag: ['marketing', 'digital', 'business'],
        instructions: [
            'No prior experience needed',
            'Basic computer skills',
            'Internet connection'
        ],
        status: 'Published'
    },
    {
        courseName: 'Business Strategy & Growth',
        courseDescription: 'Learn how to develop and implement successful business strategies',
        instructorId: INSTRUCTOR_ID,
        whatYouWillLearn: 'Business Planning, Market Analysis, Growth Strategies, Financial Planning',
        price: 199.99,
        thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
        categoryId: null,
        tag: ['business', 'strategy', 'entrepreneurship'],
        instructions: [
            'Basic business knowledge',
            'Interest in entrepreneurship',
            'No prior experience needed'
        ],
        status: 'Published'
    }
];

async function seedData() {
    try {
        // Create categories
        console.log('Creating categories...');
        const createdCategories = await Promise.all(
            categories.map(category => Category.create(category))
        );
        console.log('Categories created successfully!');

        // Create courses with category IDs
        console.log('Creating courses...');
        const createdCourses = await Promise.all(
            courses.map((course, index) => {
                const categoryId = createdCategories[index % createdCategories.length].id;
                return Course.create({ ...course, categoryId });
            })
        );
        console.log('Courses created successfully!');

        console.log('Seed data inserted successfully!');
    } catch (error) {
        console.error('Error seeding data:', error);
    }
}

// Run the seed function
seedData(); 