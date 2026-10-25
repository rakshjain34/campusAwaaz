const express = require("express");
const wrapAsync = require("../utils/wrapAsync.js");
const router = express.Router();
const announcementController = require("../controllers/announcements.js");
const { isLoggedIn, canPublishAnnouncement, isAnnouncementAuthor } = require("../middleware.js");

router
    .route("/")
    .get(wrapAsync(announcementController.index))
    .post(isLoggedIn, canPublishAnnouncement, wrapAsync(announcementController.create));

router
    .route("/new")
    .get(isLoggedIn, canPublishAnnouncement, wrapAsync(announcementController.renderNewForm));

router
    .route("/:id")
    .get(wrapAsync(announcementController.show))
    .put(isLoggedIn, isAnnouncementAuthor, wrapAsync(announcementController.update))
    .delete(isLoggedIn, isAnnouncementAuthor, wrapAsync(announcementController.delete));

router
    .route("/:id/edit")
    .get(isLoggedIn, isAnnouncementAuthor, wrapAsync(announcementController.renderEditForm));

module.exports = router;