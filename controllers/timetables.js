const Timetable = require('../models/timetable.js');
const RoleAssignment = require('../models/roles.js');
const { cloudinary } = require('../cloudConfig.js');

const getAllowedScopes = async (user) => {
    if (user.accountType === 'Staff') {
        return [
            {
                scope: 'College',
                publisherRole: 'Staff',
            },
        ];
    }

    const roles = await RoleAssignment.find({
        user: user._id,
    });

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

const canViewTimetable = (timetable, user) => {
    if (timetable.scope === 'College') return true;

    if (timetable.scope === 'Class') {
        return (
            user.accountType === 'Student' &&
            user.branch === timetable.branch &&
            Number(user.year) === timetable.year &&
            user.section === timetable.section
        );
    }

    if (timetable.scope === 'Club') {
        return user.accountType === 'Student' && (user.clubs || []).includes(timetable.club);
    }

    return false;
};

const deleteCloudinaryFile = async (timetable) => {
    if (!timetable.attachmentPublicId) return;

    try {
        await cloudinary.uploader.destroy(timetable.attachmentPublicId, {
            resource_type: 'image',
        });
    } catch (err) {
        console.error('Cloudinary deletion error:', err.message);
    }
};

// INDEX
module.exports.index = async (req, res) => {
    const user = req.user;

    const visibilityConditions = [{ scope: 'College' }];

    if (user.accountType === 'Student') {
        visibilityConditions.push({
            scope: 'Class',
            branch: user.branch,
            year: user.year,
            section: user.section,
        });

        if (user.clubs && user.clubs.length) {
            visibilityConditions.push({
                scope: 'Club',
                club: { $in: user.clubs },
            });
        }
    }

    const query = {
        $or: visibilityConditions,
    };

    if (req.query.category) {
        query.category = req.query.category;
    }

    if (req.query.search) {
        query.$and = [
            {
                $or: [
                    {
                        title: {
                            $regex: req.query.search,
                            $options: 'i',
                        },
                    },
                    {
                        description: {
                            $regex: req.query.search,
                            $options: 'i',
                        },
                    },
                ],
            },
        ];
    }

    const timetables = await Timetable.find(query)
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 });

    const allowedScopes = await getAllowedScopes(user);

    res.render('timetables/index.ejs', {
        timetables,
        allowedScopes,
        filters: {
            category: req.query.category || '',
            search: req.query.search || '',
        },
    });
};

// NEW FORM
module.exports.renderNewForm = async (req, res) => {
    const allowedScopes = await getAllowedScopes(req.user);

    if (!allowedScopes.length) {
        req.flash('error', 'You cannot upload timetables.');
        return res.redirect('/announcements');
    }

    res.render('timetables/new.ejs', {
        allowedScopes,
    });
};

// CREATE
module.exports.create = async (req, res) => {
    if (!req.file) {
        req.flash('error', 'Please upload an image or PDF.');
        return res.redirect('/timetables/new');
    }

    const allowedScopes = await getAllowedScopes(req.user);

    const { title, description, category, scope, club } = req.body.timetable;

    let selectedScope;

    if (req.user.accountType === 'Staff') {
        selectedScope = allowedScopes.find((s) => s.scope === 'College');
    } else {
        selectedScope = allowedScopes.find((s) => {
            if (s.scope !== scope) return false;

            if (s.scope === 'Club') {
                return s.club === club;
            }

            return true;
        });
    }

    if (!selectedScope) {
        req.flash('error', 'You are not authorized to upload here.');
        return res.redirect('/timetables');
    }

    const timetableData = {
        title,
        description,
        category,
        scope: selectedScope.scope,
        publisherRole: selectedScope.publisherRole,
        uploadedBy: req.user._id,

        attachment: req.file.path,
        attachmentPublicId: req.file.filename,

        attachmentType: req.file.mimetype === 'application/pdf' ? 'file' : 'image',
    };

    if (selectedScope.scope === 'Class') {
        timetableData.branch = selectedScope.branch;
        timetableData.year = selectedScope.year;
        timetableData.section = selectedScope.section;
    }

    if (selectedScope.scope === 'Club') {
        timetableData.club = selectedScope.club;
    }

    const timetable = new Timetable(timetableData);

    await timetable.save();

    req.flash('success', 'Resource uploaded successfully!');

    res.redirect('/announcements');
};

// SHOW
module.exports.show = async (req, res) => {
    const timetable = await Timetable.findById(req.params.id).populate('uploadedBy', 'name');

    if (!timetable) {
        req.flash('error', 'Resource not found.');
        return res.redirect('/announcements');
    }

    if (!canViewTimetable(timetable, req.user)) {
        req.flash('error', 'You cannot access this resource.');
        return res.redirect('/announcements');
    }

    res.render('timetables/show.ejs', {
        timetable,
    });
};

// EDIT FORM
module.exports.renderEditForm = async (req, res) => {
    res.render('timetables/edit.ejs', {
        timetable: res.locals.timetable,
    });
};

// UPDATE
module.exports.update = async (req, res) => {
    const timetable = res.locals.timetable;

    const { title, description, category } = req.body.timetable;

    timetable.title = title;
    timetable.description = description;
    timetable.category = category;

    if (req.file) {
        await deleteCloudinaryFile(timetable);

        timetable.attachment = req.file.path;
        timetable.attachmentPublicId = req.file.filename;

        timetable.attachmentType = req.file.mimetype === 'application/pdf' ? 'file' : 'image';
    }

    await timetable.save();

    req.flash('success', 'Resource updated successfully!');

    res.redirect('/timetables');
};

// DELETE
module.exports.delete = async (req, res) => {
    const timetable = res.locals.timetable;

    await deleteCloudinaryFile(timetable);

    await Timetable.findByIdAndDelete(timetable._id);

    req.flash('success', 'Resource deleted successfully!');

    res.redirect('/timetables');
};

// MY UPLOADS
module.exports.mine = async (req, res) => {
    const timetables = await Timetable.find({
        uploadedBy: req.user._id,
    }).sort({ createdAt: -1 });

    res.render('timetables/mine.ejs', {
        timetables,
    });
};
