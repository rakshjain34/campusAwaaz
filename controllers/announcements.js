const Announcement = require("../models/announcement.js");

const matchesAudience = (announcement, user) => {
    if (!user) return false;

    const targetTypes = announcement.targetTypes || [];
    const isEveryone = targetTypes.includes("Everyone");
    const isStudent = targetTypes.includes("Student");
    const isStaff = targetTypes.includes("Staff");

    if (isEveryone) return true;

    if (user.accountType === "Staff") {
        if (!isStaff) return false;
        const staffAudience = announcement.staffAudience || ["All"];
        if (staffAudience.includes("All")) return true;
        return staffAudience.includes("Wardens") && typeof user.designation === "string" && user.designation.toLowerCase().includes("warden");
    }

    if (user.accountType === "Student" && isStudent) {
        const branchMatches = !announcement.branches?.length || announcement.branches.includes(user.branch);
        const yearMatches = !announcement.years?.length || announcement.years.includes(Number(user.year));
        const sectionMatches = !announcement.sections?.length || announcement.sections.includes(user.section);
        return branchMatches && yearMatches && sectionMatches;
    }

    return false;
};

module.exports.index = async (req, res, next) => {
    try {
        const allAnnouncements = await Announcement.find({})
            .populate("postedBy")
            .sort({ isPinned: -1, createdAt: -1 });

        const announcements = allAnnouncements.filter(announcement =>
            matchesAudience(announcement, req.user)
        );

        res.render("announcements/index.ejs", {
            announcements,
            currUser: req.user
        });
    } catch (err) {
        next(err);
    }
};

module.exports.renderNewForm = (req, res) => {
    return res.render("announcements/new.ejs");
};

module.exports.create = async (req, res, next) => {
    try {
        const data = req.body.announcement;
        const targetTypes = Array.isArray(data.targetTypes) ? data.targetTypes : [data.targetTypes].filter(Boolean);
        const announcement = new Announcement({
            title: data.title,
            description: data.description,
            category: data.category,
            targetTypes,
            staffAudience: targetTypes.includes("Staff") ? (Array.isArray(data.staffAudience) ? data.staffAudience : [data.staffAudience].filter(Boolean)) : [],
            branches: targetTypes.includes("Student") ? (Array.isArray(data.branches) ? data.branches : [data.branches].filter(Boolean)) : [],
            years: targetTypes.includes("Student") ? (Array.isArray(data.years) ? data.years.map(Number) : data.years ? [Number(data.years)] : []) : [],
            sections: targetTypes.includes("Student") ? (Array.isArray(data.sections) ? data.sections : [data.sections].filter(Boolean)) : [],
            priority: data.priority || "Normal",
            postedBy: req.user._id
        });

        await announcement.save();
        req.flash("success", "Announcement published successfully!");
        res.redirect("/announcements");
    } catch (err) {
        next(err);
    }
};

module.exports.show = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id).populate("postedBy");

        if (!announcement) {
            req.flash("error", "Announcement not found.");
            return res.redirect("/announcements");
        }

        if (!matchesAudience(announcement, req.user)) {
            req.flash("error", "You do not have permission to view this announcement.");
            return res.redirect("/announcements");
        }

        res.render("announcements/show.ejs", {
            announcement,
            currUser: req.user
        });
    } catch (err) {
        next(err);
    }
};

module.exports.renderEditForm = (req, res) => {
    res.render("announcements/edit.ejs", {
        announcement: res.locals.announcement
    });
};

module.exports.update = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            req.flash("error", "Announcement not found.");
            return res.redirect("/announcements");
        }

        const data = req.body.announcement;
        const targetTypes = Array.isArray(data.targetTypes) ? data.targetTypes : [data.targetTypes].filter(Boolean);

        announcement.title = data.title;
        announcement.description = data.description;
        announcement.category = data.category;
        announcement.targetTypes = targetTypes;
        announcement.staffAudience = targetTypes.includes("Staff") ? (Array.isArray(data.staffAudience) ? data.staffAudience : [data.staffAudience].filter(Boolean)) : [];
        announcement.branches = targetTypes.includes("Student") ? (Array.isArray(data.branches) ? data.branches : [data.branches].filter(Boolean)) : [];
        announcement.years = targetTypes.includes("Student") ? (Array.isArray(data.years) ? data.years.map(Number) : data.years ? [Number(data.years)] : []) : [];
        announcement.sections = targetTypes.includes("Student") ? (Array.isArray(data.sections) ? data.sections : [data.sections].filter(Boolean)) : [];
        announcement.priority = data.priority || "Normal";

        await announcement.save();
        req.flash("success", "Announcement updated successfully!");
        res.redirect(`/announcements/${announcement._id}`);
    } catch (err) {
        next(err);
    }
};

module.exports.delete = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            req.flash("error", "Announcement not found.");
            return res.redirect("/announcements");
        }

        await Announcement.findByIdAndDelete(req.params.id);
        req.flash("success", "Announcement deleted successfully!");
        res.redirect("/announcements");
    } catch (err) {
        next(err);
    }
};