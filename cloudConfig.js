const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const folder = req.baseUrl.includes('timetables')
            ? 'CampusAwaaz/timetables'
            : 'CampusAwaaz/announcements';

        return {
            folder,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
            resource_type: 'auto',
        };
    },
});

module.exports = { cloudinary, storage };
