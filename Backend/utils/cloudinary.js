const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const originalName = file.originalname.split('.')[0];
        const ext = file.originalname.split('.').pop().toLowerCase();

        // Determine resource type based on file extension
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
        const isImage = imageExtensions.includes(ext);

        const resourceType = isImage ? 'image' : 'raw';

        return {
            folder: 'chamber_desk_documents',
            resource_type: resourceType, // Use 'raw' for PDFs and documents
            public_id: `${originalName}_${Date.now()}`,
            format: ext,
            access_mode: 'public',
            type: 'upload'
        };
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|ppt|pptx/;
        const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
        const mimetype = allowedTypes.test(file.mimetype.split('/')[1]);

        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: File type not supported! Allowed: pdf, jpg, png, ppt, doc, docx'));
        }
    }
});

module.exports = { cloudinary, upload };
