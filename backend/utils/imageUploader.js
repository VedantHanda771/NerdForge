// // const cloudinary = require('cloudinary').v2;

// // exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
// //     try {
// //         const options = { folder };
// //         if (height) options.height = height;
// //         if (quality) options.quality = quality;
// //         options.resource_type = 'auto';

// //         // Convert file buffer to base64
// //         const base64Data = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
        
// //         return await cloudinary.uploader.upload(base64Data, options);
// //     }
// //     catch (error) {
// //         console.log("Error while uploading image");
// //         console.log(error);
// //         throw error; // Re-throw the error to handle it in the controller
// //     }
// // }

// // // Function to delete a resource by public ID
// // exports.deleteResourceFromCloudinary = async (url) => {
// //     if (!url) return;

// //     try {
// //         const result = await cloudinary.uploader.destroy(url);
// //         console.log(`Deleted resource with public ID: ${url}`);
// //         console.log('Delete Resource result = ', result)
// //         return result;
// //     } catch (error) {
// //         console.log("Error while deleting image");
// //         console.log(error);
// //         throw error;
// //     }
// // }


// const cloudinary = require('cloudinary').v2;

// exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
//     try {
//         const options = { folder };
//         if (height) options.height = height;
//         if (quality) options.quality = quality;

//         // options.resourse_type = 'auto';
//         options.resource_type = 'auto';
//         return await cloudinary.uploader.upload(file.tempFilePath, options);
//     }
//     catch (error) {
//         console.log("Error while uploading image");
//         console.log(error);
//     }
// }



// // Function to delete a resource by public ID
// exports.deleteResourceFromCloudinary = async (url) => {
//     if (!url) return;

//     try {
//         const result = await cloudinary.uploader.destroy(url);
//         console.log(`Deleted resource with public ID: ${url}`);
//         console.log('Delete Resourse result = ', result)
//         return result;
//     } catch (error) {
//         console.error(`Error deleting resource with public ID ${url}:`, error);
//         throw error;
//     }
// };

const cloudinary = require('cloudinary').v2;

const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

// Enable file uploads and set temp file directory
// app.use(fileUpload({
//     useTempFiles: true,
//     tempFileDir: "backend\temp", // <- Your new temp folder
// }));


// Function to upload image to Cloudinary
// exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
//     try {
//         const options = {
//             folder: folder || "user_images", // Default folder if not provided
//             resource_type: "auto", // Auto-detect the resource type (image, video, etc.)
//         };

//         // Optional parameters for resizing and compression
//         if (height) options.height = height;
//         if (quality) options.quality = quality;

//         // Ensure file.tempFilePath exists (this comes from multer)
//         if (!file || !file.tempFilePath) {
//             throw new Error('File upload failed: No file or tempFilePath provided');
//         }

//         // Upload image to Cloudinary using tempFilePath (uploaded file path)
//         const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, options);

//         // Return the Cloudinary response, which includes the secure URL of the uploaded image
//         return uploadResult;
//     } catch (error) {
//         console.error("Error while uploading image to Cloudinary:", error);
//         throw new Error('Image upload failed');
//     }
// };

// Function to delete a resource by public ID from Cloudinary

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    try {
        // Validate file
        if (!file) {
            throw new Error('No file provided');
        }

        if (!file.data) {
            console.error('File data is missing:', file);
            throw new Error('File data is missing');
        }

        if (!file.mimetype) {
            console.error('File mimetype is missing:', file);
            throw new Error('File mimetype is missing');
        }

        // Log file details for debugging
        console.log('File details:', {
            name: file.name,
            mimetype: file.mimetype,
            size: file.size,
            dataLength: file.data.length
        });

        const options = {
            folder: folder || "user_images",
            resource_type: "auto",
        };

        if (height) options.height = height;
        if (quality) options.quality = quality;

        // Convert file buffer to base64
        const base64Data = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(base64Data, options);
        
        if (!result || !result.secure_url) {
            console.error('Cloudinary upload result is invalid:', result);
            throw new Error('Invalid upload result from Cloudinary');
        }

        return result;
    } catch (error) {
        console.error("Error while uploading to Cloudinary:", {
            error: error,
            message: error.message,
            stack: error.stack
        });
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
};

exports.deleteResourceFromCloudinary = async (url) => {
    if (!url) return;

    try {
        const result = await cloudinary.uploader.destroy(url);
        console.log(`Deleted resource with public ID: ${url}`);
        console.log('Delete Resource result:', result);
        return result;
    } catch (error) {
        console.error(`Error deleting resource with public ID ${url}:`, error);
        throw new Error('Error deleting image from Cloudinary');
    }
};
