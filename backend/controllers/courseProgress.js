const Section = require("../models/section")
const SubSection = require("../models/subSection")
const CourseProgress = require("../models/courseProgress")


// ================ update Course Progress ================
exports.updateCourseProgress = async (req, res) => {
  const { courseId, subsectionId } = req.body
  const userId = req.user.id

  try {
    // Check if the subsection is valid
    const subsection = await SubSection.findById(subsectionId)
    if (!subsection) {
      return res.status(404).json({ error: "Invalid subsection" })
    }

    // Find the course progress record for the user and course
    let courseProgress = await CourseProgress.findByUserId(userId)
    courseProgress = courseProgress.find(cp => cp.courseId === courseId)

    if (!courseProgress) {
      // If course progress doesn't exist, return error
      return res.status(404).json({
        success: false,
        message: "Course progress Does Not Exist",
      })
    } else {
      // If course progress exists, check if the subsection is already completed
      if (courseProgress.completedVideos.includes(subsectionId)) {
        return res.status(400).json({ error: "Subsection already completed" })
      }
      // Add the subsection to the completedVideos array
      courseProgress.completedVideos.push(subsectionId)
      // Update in DB
      await CourseProgress.updateCompletedVideos(courseProgress.id, courseProgress.completedVideos)
    }

    return res.status(200).json({ message: "Course progress updated" })
  }
  catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}



// ================ get Progress Percentage ================
// exports.getProgressPercentage = async (req, res) => {
//   const { courseId } = req.body
//   const userId = req.user.id

//   if (!courseId) {
//     return res.status(400).json({ error: "Course ID not provided." })
//   }

//   try {
//     // Find the course progress document for the user and course
//     let courseProgress = await CourseProgress.findOne({
//       courseID: courseId,
//       userId: userId,
//     })
//       .populate({
//         path: "courseID",
//         populate: {
//           path: "courseContent",
//         },
//       })
//       .exec()

//     if (!courseProgress) {
//       return res
//         .status(400)
//         .json({ error: "Can not find Course Progress with these IDs." })
//     }
//     console.log(courseProgress, userId)
//     let lectures = 0
//     courseProgress.courseID.courseContent?.forEach((sec) => {
//       lectures += sec.subSection.length || 0
//     })

//     let progressPercentage =
//       (courseProgress.completedVideos.length / lectures) * 100

//     // To make it up to 2 decimal point
//     const multiplier = Math.pow(10, 2)
//     progressPercentage =
//       Math.round(progressPercentage * multiplier) / multiplier

//     return res.status(200).json({
//       data: progressPercentage,
//       message: "Succesfully fetched Course progress",
//     })
//   } catch (error) {
//     console.error(error)
//     return res.status(500).json({ error: "Internal server error" })
//   }
// }
