const express = require("express");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const controller = require("../controllers/complaints.js");
const Complaint = require("../models/complaint.js");
const router = express.Router();

const staffOnly = (req, res, next) => {
    if (req.user?.accountType !== "Staff") {
        req.flash("error", "This action is for staff members only.");
        return res.redirect("/complaints");
    }
    next();
};

const studentOnly = (req, res, next) => {
    if (req.user?.accountType !== "Student") {
        req.flash("error", "This action is for students only.");
        return res.redirect("/complaints");
    }
    next();
};

const complaintOwnerOrStaff = async (req, res, next) => {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        req.flash("error", "Complaint not found.");
        return res.redirect("/complaints");
    }
    const owns = complaint.createdBy.toString() === req.user._id.toString();
    if (!owns && req.user.accountType !== "Staff") {
        req.flash("error", "Only the complaint owner or staff can delete this complaint.");
        return res.redirect(`/complaints/${complaint._id}`);
    }
    res.locals.complaint = complaint;
    next();
};
router.get("/", isLoggedIn, wrapAsync(controller.index));
router.get("/new", isLoggedIn, studentOnly, controller.renderNewForm);
router.get("/mine", isLoggedIn, studentOnly, wrapAsync(controller.mine));
router.post("/", isLoggedIn, studentOnly, wrapAsync(controller.create));
router.post("/:id/upvote", isLoggedIn, studentOnly, wrapAsync(controller.upvote));
router.post("/:id/status", isLoggedIn, staffOnly, wrapAsync(controller.updateStatus));
router.post("/:id/updates", isLoggedIn, staffOnly, wrapAsync(controller.addUpdate));
router.get("/:id/edit", isLoggedIn, complaintOwnerOrStaff, wrapAsync(controller.renderEditForm));
router.delete("/:id", isLoggedIn, complaintOwnerOrStaff, wrapAsync(controller.delete));
router.get("/:id", isLoggedIn, wrapAsync(controller.show));

module.exports = router;
