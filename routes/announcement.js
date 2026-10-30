const express = require('express');
const router = express.Router();

const wrapAsync = require('../utils/wrapAsync.js');
const controller = require('../controllers/announcements.js');

const { isLoggedIn, canPublishAnnouncement, isAnnouncementAuthor } = require('../middleware.js');

const upload = require('../middleware/upload.js');

router.get('/', isLoggedIn, wrapAsync(controller.index));

router.get('/mine', isLoggedIn, wrapAsync(controller.mine));

router.get('/new', isLoggedIn, canPublishAnnouncement, wrapAsync(controller.renderNewForm));

router.post(
    '/',
    isLoggedIn,
    canPublishAnnouncement,
    upload.single('attachment'),
    wrapAsync(controller.create)
);

router.get('/:id/edit', isLoggedIn, isAnnouncementAuthor, wrapAsync(controller.renderEditForm));

router.put(
    '/:id',
    isLoggedIn,
    isAnnouncementAuthor,
    upload.single('attachment'),
    wrapAsync(controller.update)
);

router.delete('/:id', isLoggedIn, isAnnouncementAuthor, wrapAsync(controller.delete));

router.get('/:id', isLoggedIn, wrapAsync(controller.show));

module.exports = router;
