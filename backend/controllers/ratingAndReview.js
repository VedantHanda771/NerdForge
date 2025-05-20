const User = require('../models/user')
const Course = require('../models/course')
const RatingAndReview = require('../models/ratingAndReview')

// ================ Create Rating ================
exports.createRating = async (req, res) => {
    try {
        // get data
        const { rating, review, courseId } = req.body;
        const userId = req.user.id;

        // validation
        if (!rating || !review || !courseId) {
            return res.status(401).json({
                success: false,
                message: "All fields are required"
            });
        }

        // check user is enrolled in course
        const courseDetails = await Course.findById(courseId);
        if (!courseDetails || !courseDetails.enrolledStudentIds.includes(userId)) {
            return res.status(404).json({
                success: false,
                message: 'Student is not enrolled in the course'
            });
        }

        // check user already reviewed
        const existingReviews = await RatingAndReview.findByCourseId(courseId);
        const alreadyReviewed = existingReviews.some(review => review.user === userId);

        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: 'Course is already reviewed by the user'
            });
        }

        // create entry in DB
        const ratingReview = await RatingAndReview.create({
            user: userId,
            course: courseId,
            rating,
            review
        });

        // return response
        return res.status(200).json({
            success: true,
            data: ratingReview,
            message: "Rating and Review created Successfully",
        });
    }
    catch (error) {
        console.log('Error while creating rating and review');
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while creating rating and review',
        });
    }
}

// ================ Get Average Rating ================
exports.getAverageRating = async (req, res) => {
    try {
        // get course ID
        const courseId = req.body.courseId;
        
        // calculate avg rating
        const averageRating = await RatingAndReview.getAverageRating(courseId);

        // return rating
        return res.status(200).json({
            success: true,
            averageRating: averageRating || 0,
            message: averageRating ? 'Average rating calculated successfully' : 'Average Rating is 0, no ratings given till now'
        });
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// ================ Get All Rating And Reviews ================
exports.getAllRatingReview = async(req, res) => {
    try {
        const allReviews = await RatingAndReview.findByCourseId(null); // null to get all reviews

        return res.status(200).json({
            success: true,
            data: allReviews,
            message: "All reviews fetched successfully"
        });
    }
    catch(error) {
        console.log('Error while fetching all ratings');
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while fetching all ratings',
        });
    }
}
