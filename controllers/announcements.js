const Announcement = require('../models/announcement.js');
const RoleAssignment = require('../models/roles.js');
const { cloudinary } = require('../cloudConfig.js');
const Timetable = require('../models/timetable.js');
const getAssignments = async (userId) => {
    return await RoleAssignment.find({ user: userId });
};

const getAllowedScopes = async (user) => {
    if (user.accountType === 'Staff') {
        return [{ scope: 'College', publisherRole: 'Staff' }];
    }

    const roles = await getAssignments(user._id);

    const scopes = [];

    roles.forEach((role) => {
        if (role.role === 'CR') {
            scopes.push({
                scope: 'Class',
                publisherRole: 'CR',
                branch: role.branch,
                year: role.year,
                section: role.section,
            });
        }

        if (role.role === 'GenSec') {
            scopes.push({
                scope: 'Club',
                publisherRole: 'GenSec',
                club: role.club,
            });
        }
    });

    return scopes;
};

const canViewAnnouncement = (announcement, user) => {
    if (announcement.scope === 'College') return true;

    if (announcement.scope === 'Class') {
        return (
            user.accountType === 'Student' &&
            user.branch === announcement.branch &&
            Number(user.year) === announcement.year &&
            user.section === announcement.section
        );
    }

    if (announcement.scope === 'Club') {
        return user.accountType === 'Student' && (user.clubs || []).includes(announcement.club);
    }

    return false;
};

const getExpiryFilter = () => ({
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
});

const getUploadType = (file) => {
    if (!file) return '';

    return file.mimetype === 'application/pdf' ? 'file' : 'image';
};

const deleteCloudinaryFile = async (announcement) => {
    if (!announcement.attachmentPublicId) return;

    try {
        await cloudinary.uploader.destroy(announcement.attachmentPublicId, {
            resource_type: announcement.attachmentType === 'file' ? 'raw' : 'image',
        });
    } catch (err) {
        console.error('Cloudinary deletion failed:', err.message);
    }
};

// INDEX
module.exports.index = async (req, res) => {
    const user = req.user;

    const scope = req.query.scope || 'all';
    const category = req.query.category || '';
    const priority = req.query.priority || '';
    const search = req.query.search || '';

    const visibilityConditions = [{ scope: 'College' }];

    if (user.accountType === 'Student') {
        visibilityConditions.push({
            scope: 'Class',
            branch: user.branch,
            year: user.year,
            section: user.section,
        });

        if (user.clubs && user.clubs.length > 0) {
            visibilityConditions.push({
                scope: 'Club',
                club: { $in: user.clubs },
            });
        }
    }

    const query = {
        $and: [{ $or: visibilityConditions }, getExpiryFilter()],
    };

    if (scope === 'College') {
        query.$and.push({ scope: 'College' });
    }

    if (scope === 'Class') {
        query.$and.push({
            scope: 'Class',
            branch: user.branch,
            year: user.year,
            section: user.section,
        });
    }

    if (scope === 'Club') {
        query.$and.push({
            scope: 'Club',
            club: { $in: user.clubs || [] },
        });
    }

    if (category) query.$and.push({ category });
    if (priority) query.$and.push({ priority });

    if (search.trim()) {
        query.$and.push({
            $or: [
                { title: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } },
            ],
        });
    }

    const announcements = await Announcement.find(query)
        .populate('postedBy', 'name accountType')
        .sort({ isPinned: -1, createdAt: -1 });

    const allowedScopes = await getAllowedScopes(user);
    const timetableConditions = [{ scope: 'College' }];

    if (user.accountType === 'Student') {
        timetableConditions.push({
            scope: 'Class',
            branch: user.branch,
            year: user.year,
            section: user.section,
        });

        if (user.clubs && user.clubs.length) {
            timetableConditions.push({
                scope: 'Club',
                club: { $in: user.clubs },
            });
        }
    }

    const timetables = await Timetable.find({
        $or: timetableConditions,
    })
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(4);
    res.render('announcements/index.ejs', {
        announcements,
        allowedScopes,
        activeScope: scope,
        filters: { category, priority, search },
        timetables,
    });
};

// MY ANNOUNCEMENTS
module.exports.mine = async (req, res) => {
    const announcements = await Announcement.find({
        postedBy: req.user._id,
    })
        .populate('postedBy', 'name')
        .sort({ createdAt: -1 });

    res.render('announcements/mine.ejs', { announcements });
};

// NEW FORM
module.exports.renderNewForm = async (req, res) => {
    const allowedScopes = await getAllowedScopes(req.user);

    if (!allowedScopes.length) {
        req.flash('error', 'You are not authorized to publish announcements.');
        return res.redirect('/announcements');
    }

    res.render('announcements/new.ejs', { allowedScopes });
};

// CREATE
module.exports.create = async (req, res) => {
    const allowedScopes = await getAllowedScopes(req.user);

    const { title, description, category, priority, scope, club } = req.body.announcement;

    let selectedScope;

    if (req.user.accountType === 'Staff') {
        selectedScope = allowedScopes.find((s) => s.scope === 'College');
    } else {
        selectedScope = allowedScopes.find((s) => {
            if (s.scope !== scope) return false;

            if (scope === 'Club') return s.club === club;

            return true;
        });
    }

    if (!selectedScope) {
        req.flash('error', 'You are not authorized to publish in this section.');
        return res.redirect('/announcements');
    }

    const announcementData = {
        title,
        description,
        category,
        priority,
        scope: selectedScope.scope,
        publisherRole: selectedScope.publisherRole,
        postedBy: req.user._id,
    };

    if (selectedScope.scope === 'Class') {
        announcementData.branch = selectedScope.branch;
        announcementData.year = selectedScope.year;
        announcementData.section = selectedScope.section;
    }

    if (selectedScope.scope === 'Club') {
        announcementData.club = selectedScope.club;
    }

    if (req.file) {
        announcementData.attachment = req.file.path;
        announcementData.attachmentPublicId = req.file.filename;
        announcementData.attachmentType = getUploadType(req.file);
    }

    const announcement = new Announcement(announcementData);

    await announcement.save();

    req.flash('success', 'Announcement published successfully!');
    res.redirect('/announcements');
};

// SHOW
module.exports.show = async (req, res) => {
    const announcement = await Announcement.findById(req.params.id).populate(
        'postedBy',
        'name accountType'
    );

    if (!announcement) {
        req.flash('error', 'Announcement not found.');
        return res.redirect('/announcements');
    }

    if (!canViewAnnouncement(announcement, req.user)) {
        req.flash('error', 'You cannot access this announcement.');
        return res.redirect('/announcements');
    }

    res.render('announcements/show.ejs', { announcement });
};

// EDIT FORM
module.exports.renderEditForm = async (req, res) => {
    const announcement = res.locals.announcement;

    res.render('announcements/edit.ejs', { announcement });
};

// UPDATE
module.exports.update = async (req, res) => {
    const announcement = res.locals.announcement;

    const { title, description, category, priority } = req.body.announcement;

    announcement.title = title;
    announcement.description = description;
    announcement.category = category;
    announcement.priority = priority;

    if (req.file) {
        await deleteCloudinaryFile(announcement);

        announcement.attachment = req.file.path;
        announcement.attachmentPublicId = req.file.filename;
        announcement.attachmentType = getUploadType(req.file);
    }

    await announcement.save();

    req.flash('success', 'Announcement updated successfully!');
    res.redirect(`/announcements/${announcement._id}`);
};

// DELETE
module.exports.delete = async (req, res) => {
    const announcement = res.locals.announcement;

    await deleteCloudinaryFile(announcement);
    await Announcement.findByIdAndDelete(announcement._id);

    req.flash('success', 'Announcement deleted successfully!');
    res.redirect('/announcements');
};
