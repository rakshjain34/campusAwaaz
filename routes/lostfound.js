const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudConfig.js');
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn } = require('../middleware.js');
const LostFound = require('../models/lostfound.js');
const controller = require('../controllers/lostfounds.js');

const router = express.Router();

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'campusawaaz/lostfound',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, WEBP and GIF images are allowed.'));
        }
    }
});

const itemOwner = async (req, res, next) => {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
        req.flash('error', 'Item not found.');
        return res.redirect('/lostfound');
    }

    if (item.createdBy.toString() !== req.user._id.toString()) {
        req.flash('error', 'You can only manage your own reports.');
        return res.redirect(`/lostfound/${item._id}`);
    }

    res.locals.item = item;
    next();
};

router.get('/', isLoggedIn, wrapAsync(controller.index));
router.get('/new', isLoggedIn, controller.renderNewForm);
router.get('/mine', isLoggedIn, wrapAsync(controller.mine));
router.post('/', isLoggedIn, upload.single('image'), wrapAsync(controller.create));

router.get('/:id/edit', isLoggedIn, itemOwner, controller.renderEditForm);
router.put('/:id', isLoggedIn, itemOwner, upload.single('image'), wrapAsync(controller.update));
router.post('/:id/resolve', isLoggedIn, itemOwner, wrapAsync(controller.resolve));
router.delete('/:id', isLoggedIn, itemOwner, wrapAsync(controller.delete));
router.get('/:id', isLoggedIn, wrapAsync(controller.show));

module.exports = router;