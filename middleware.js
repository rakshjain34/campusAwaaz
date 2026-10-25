
const ExpressError = require("./utils/ExpressError");
const Announcement = require("./models/announcement.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to continue.");
        return res.redirect("/user/login");
    }
    next();
};

module.exports.isShopkeeper = (req, res, next) => {
    if (req.user && req.user.accountType === "Shopkeeper") {
        return next();
    }

    req.flash("error", "Only shopkeepers can perform this action.");
    return res.redirect("/services");
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

// module.exports.isCRorGenSec = (req, res, next) => {
//     if (!req.isAuthenticated()) {
//         req.session.redirectUrl = req.originalUrl;
//         req.flash("error", "You must be logged in to continue.");
//         return res.redirect("/user/login");
//     }
//     if ( req.user.accountType !== "Student" ||
//         !["CR", "GenSec"].includes(req.user.studentRole)) {
//         req.flash("error","Only CRs and GenSecs can manage announcements.");
//         return res.redirect("/announcements");
//     }
//     next();
// };

module.exports.canPublishAnnouncement = (req, res, next) => {
    const user = req.user;
    if (!user) {
        req.flash("error", "You must be logged in to continue.");
        return res.redirect("/user/login");
    }

    const canPublish =
        user.accountType === "Staff" ||
        (
            user.accountType === "Student" &&
            ["CR", "GenSec"].includes(user.studentRole)
        );

    if (!canPublish) {
        req.flash("error", "Only CRs, GenSecs, and Staff can publish announcements.");
        return res.redirect("/announcements");
    }
    next();
};

module.exports.isAnnouncementAuthor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findById(id);

        if (!announcement) {
            req.flash("error", "Announcement not found.");
            return res.redirect("/announcements");
        }

        if (!announcement.postedBy || announcement.postedBy.toString() !== req.user._id.toString()) {
            req.flash("error", "Only the author can edit or delete this announcement.");
            return res.redirect(`/announcements/${id}`);
        }

        res.locals.announcement = announcement;
        next();
    } catch (err) {
        next(err);
    }
};
