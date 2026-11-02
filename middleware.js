const ExpressError = require('./utils/ExpressError');
const Announcement = require('./models/announcement.js');
const RoleAssignment = require('./models/roles.js');
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash('error', 'You must be logged in to continue.');
        return res.redirect('/user/login');
    }
    next();
};

module.exports.isShopkeeper = (req, res, next) => {
    if (req.user && req.user.accountType === 'Shopkeeper') {
        return next();
    }

    req.flash('error', 'Only shopkeepers can perform this action.');
    return res.redirect('/services');
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.canPublishAnnouncement = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            req.flash('error', 'Please log in first.');

            return res.redirect('/user/login');
        }

        // Staff can publish college-wide announcements.

        if (user.accountType === 'Staff') {
            return next();
        }

        // Only students can have CR or GenSec designations.

        if (user.accountType !== 'Student') {
            req.flash('error', 'You are not authorized to publish.');

            return res.redirect('/announcements');
        }

        const assignments = await RoleAssignment.find({
            user: user._id,
        });

        const hasValidCR = assignments.some(
            (role) =>
                role.role === 'CR' &&
                role.branch === user.branch &&
                Number(role.year) === Number(user.year) &&
                role.section === user.section
        );

        const hasValidGenSec = assignments.some(
            (role) => role.role === 'GenSec' && role.club && (user.clubs || []).includes(role.club)
        );

        if (hasValidCR || hasValidGenSec) {
            return next();
        }

        req.flash(
            'error',

            'Only Staff, CRs and General Secretaries can publish.'
        );

        return res.redirect('/announcements');
    } catch (err) {
        next(err);
    }
};
module.exports.isAnnouncementAuthor = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            req.flash('error', 'Announcement not found.');
            return res.redirect('/announcements');
        }

        if (
            !announcement.postedBy ||
            announcement.postedBy.toString() !== req.user._id.toString()
        ) {
            req.flash('error', 'You are not authorized to do that.');
            return res.redirect('/announcements');
        }

        res.locals.announcement = announcement;

        next();
    } catch (err) {
        next(err);
    }
};
