const Announcement = require('../models/announcement.js');
const RoleAssignment = require('../models/roles.js');
const { cloudinary } = require('../cloudConfig.js');
const Timetable = require('../models/timetable.js');

// GET VALID ROLE ASSIGNMENTS
const getAssignments = async (userId) => {
    return await RoleAssignment.find({
        user: userId,
    });
};

// GET ALL SCOPES USER IS ALLOWED TO PUBLISH TO
const getAllowedScopes = async (user) => {
    // STAFF
    if (user.accountType === 'Staff' || user.accountType === 'Admin') {
        return [
            {
                scope: 'College',
                publisherRole: user.accountType,
            },
        ];
    }

    if (user.accountType !== 'Student') {
        return [];
    }

    const roles = await getAssignments(user._id);

    const scopes = [];

    let hasGenSec = false;

    for (const role of roles) {
        // CR: only their own class
        if (
            role.role === 'CR' &&
            role.branch === user.branch &&
            Number(role.year) === Number(user.year) &&
            role.section === user.section
        ) {
            scopes.push({
                scope: 'Class',
                publisherRole: 'CR',
                branch: role.branch,
                year: role.year,
                section: role.section,
            });
        }

        // GenSec: only clubs they belong to
        if (role.role === 'GenSec' && role.club && (user.clubs || []).includes(role.club)) {
            if (!hasGenSec) {
                scopes.push({
                    scope: 'College',
                    publisherRole: 'GenSec',
                });

                hasGenSec = true;
            }

            scopes.push({
                scope: 'Club',
                publisherRole: 'GenSec',
                club: role.club,
            });
        }
    }

    return scopes;
};

// CHECK WHETHER USER CAN VIEW AN ANNOUNCEMENT
const canViewAnnouncement = (announcement, user) => {
    if (user?.accountType === 'Admin') return true;

    if (announcement.scope === 'College') {
        return true;
    }

    if (announcement.scope === 'Class') {
        return (
            user.accountType === 'Student' &&
            user.branch === announcement.branch &&
            Number(user.year) === Number(announcement.year) &&
            user.section === announcement.section
        );
    }

    if (announcement.scope === 'Club') {
        return user.accountType === 'Student' && (user.clubs || []).includes(announcement.club);
    }

    return false;
};

// EXPIRY FILTER
const getExpiryFilter = () => ({
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
});

// ATTACHMENT TYPE
const getUploadType = (file) => {
    if (!file) return '';

    return file.mimetype === 'application/pdf' ? 'file' : 'image';
};

// DELETE OLD CLOUDINARY FILE
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

// ==========================================
// INDEX
// ==========================================

module.exports.index = async (req, res) => {
    const user = req.user;

    const scope = req.query.scope || 'all';
    const category = req.query.category || '';
    const priority = req.query.priority || '';
    const search = req.query.search || '';

    const visibilityConditions =
        user.accountType === 'Admin'
            ? [{ scope: { $in: ['College', 'Class', 'Club'] } }]
            : [{ scope: 'College' }];

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
        query.$and.push({
            scope: 'College',
        });
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
            club: {
                $in: user.clubs || [],
            },
        });
    }

    if (category) {
        query.$and.push({ category });
    }

    if (priority) {
        query.$and.push({ priority });
    }

    if (search.trim()) {
        query.$and.push({
            $or: [
                {
                    title: {
                        $regex: search.trim(),
                        $options: 'i',
                    },
                },
                {
                    description: {
                        $regex: search.trim(),
                        $options: 'i',
                    },
                },
            ],
        });
    }

    const announcements = await Announcement.find(query)
        .populate('postedBy', 'name accountType')
        .sort({
            isPinned: -1,
            createdAt: -1,
        });

    const allowedScopes = await getAllowedScopes(user);

    // TIMETABLE VISIBILITY
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
                club: {
                    $in: user.clubs,
                },
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
        filters: {
            category,
            priority,
            search,
        },
        timetables,
    });
};

// ==========================================
// MY ANNOUNCEMENTS
// ==========================================

module.exports.mine = async (req, res) => {
    const announcements = await Announcement.find({
        postedBy: req.user._id,
    })
        .populate('postedBy', 'name')
        .sort({ createdAt: -1 });

    res.render('announcements/mine.ejs', {
        announcements,
    });
};

// ==========================================
// NEW FORM
// ==========================================

module.exports.renderNewForm = async (req, res) => {
    const allowedScopes = await getAllowedScopes(req.user);

    if (!allowedScopes.length) {
        req.flash('error', 'You are not authorized to publish announcements.');

        return res.redirect('/announcements');
    }

    res.render('announcements/new.ejs', {
        allowedScopes,
    });
};

// ==========================================
// CREATE ANNOUNCEMENT
// ==========================================

module.exports.create = async (req, res) => {
    const allowedScopes = await getAllowedScopes(req.user);

    const announcementData = req.body.announcement;

    if (!announcementData) {
        req.flash('error', 'Invalid announcement details.');
        return res.redirect('/announcements/new');
    }

    const { title, description, category, priority, scopeIndex, eventDate, eventLocation } = announcementData;

    const parsedEventDate = eventDate ? new Date(eventDate) : null;
    if (category === 'Events' && (!parsedEventDate || Number.isNaN(parsedEventDate.getTime()))) {
        req.flash('error', 'Add a valid event date so it can appear in Coming up.');
        return res.redirect('/announcements/new');
    }

    // Validate selected scope index
    const index = Number(scopeIndex);

    if (!Number.isInteger(index) || index < 0 || index >= allowedScopes.length) {
        req.flash('error', 'You are not authorized to publish in this section.');

        return res.redirect('/announcements');
    }

    // Get the actual permitted scope from the server
    const selectedScope = allowedScopes[index];

    const newAnnouncement = {
        title,
        description,
        category,
        priority,
        eventDate: category === 'Events' ? parsedEventDate : null,
        eventLocation: category === 'Events' ? (eventLocation || '').trim() : '',

        scope: selectedScope.scope,
        publisherRole: selectedScope.publisherRole,

        postedBy: req.user._id,
    };

    // CLASS ANNOUNCEMENT
    if (selectedScope.scope === 'Class') {
        newAnnouncement.branch = selectedScope.branch;
        newAnnouncement.year = selectedScope.year;
        newAnnouncement.section = selectedScope.section;
    }

    // CLUB ANNOUNCEMENT
    if (selectedScope.scope === 'Club') {
        newAnnouncement.club = selectedScope.club;
    }

    // ATTACHMENT
    if (req.file) {
        newAnnouncement.attachment = req.file.path;
        newAnnouncement.attachmentPublicId = req.file.filename;
        newAnnouncement.attachmentType = getUploadType(req.file);
    }

    const announcement = new Announcement(newAnnouncement);

    await announcement.save();

    req.flash('success', 'Announcement published successfully!');

    res.redirect('/announcements');
};

// ==========================================
// SHOW
// ==========================================

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

    res.render('announcements/show.ejs', {
        announcement,
    });
};

// ==========================================
// EDIT FORM
// ==========================================

module.exports.renderEditForm = async (req, res) => {
    const announcement = res.locals.announcement;

    res.render('announcements/edit.ejs', {
        announcement,
    });
};

// ==========================================
// UPDATE
// ==========================================

module.exports.update = async (req, res) => {
    const announcement = res.locals.announcement;

    const { title, description, category, priority, eventDate, eventLocation } = req.body.announcement;

    const parsedEventDate = eventDate ? new Date(eventDate) : null;
    if (category === 'Events' && (!parsedEventDate || Number.isNaN(parsedEventDate.getTime()))) {
        req.flash('error', 'Add a valid event date so it can appear in Coming up.');
        return res.redirect(`/announcements/${announcement._id}/edit`);
    }

    announcement.title = title;
    announcement.description = description;
    announcement.category = category;
    announcement.priority = priority;
    announcement.eventDate = category === 'Events' ? parsedEventDate : null;
    announcement.eventLocation = category === 'Events' ? (eventLocation || '').trim() : '';

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

// ==========================================
// DELETE
// ==========================================

module.exports.delete = async (req, res) => {
    const announcement = res.locals.announcement;

    await deleteCloudinaryFile(announcement);

    await Announcement.findByIdAndDelete(announcement._id);

    req.flash('success', 'Announcement deleted successfully!');

    res.redirect('/announcements');
};

module.exports.togglePin = async (req, res) => {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
        req.flash('error', 'Announcement not found.');
        return res.redirect('/announcements');
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();
    req.flash('success', announcement.isPinned ? 'Announcement pinned.' : 'Announcement unpinned.');
    res.redirect(req.get('Referrer') || '/announcements');
};
