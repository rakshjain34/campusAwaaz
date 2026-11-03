const User = require('../models/user.js');
const RoleAssignment = require('../models/roles.js');
const RoleRequest = require('../models/roleRequest.js');
const passport = require('passport');
module.exports.renderSignup = (req, res) => {
    res.render('users/signup.ejs');
};
module.exports.renderStaffSignup = (req, res) => {
    res.render('users/staffSignup.ejs');
};
module.exports.renderShopkeeperSignup = (req, res) => {
    res.render('users/shopkeeperSignup.ejs');
};

module.exports.shopkeeperSignup = async (req, res, next) => {
    try {
        let { name, email, password } = req.body;

        const newShopkeeper = new User({
            name,
            email,
            username: email,
            accountType: 'Shopkeeper',
        });

        const regShopkeeper = await User.register(newShopkeeper, password);

        req.login(regShopkeeper, (err) => {
            if (err) {
                return next(err);
            }

            req.flash('success', 'Shopkeeper account registered successfully!');
            res.redirect('/campusAwaaz');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/user/signup/shopkeeper');
    }
};
module.exports.signup = async (req, res, next) => {
    try {
        let { name, email, password, rollNo, year, section, branch, hostel, clubs } = req.body;
        email = email.trim().toLowerCase();
        const newUser = new User({
            name,
            email,
            username: email,
            accountType: 'Student',
            rollNo,
            year,
            section,
            branch,
            hostel,
            clubs: clubs || [],
            studentRole: 'Student',
            verified: false,
        });
        const regUser = await User.register(newUser, password);
        req.login(regUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash('success', 'Account registered successfully!');
            res.redirect('/campusAwaaz');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/user/signup');
    }
};
module.exports.renderLogin = (req, res) => {
    res.render('users/login.ejs');
};
module.exports.login = async (req, res) => {
    const redirectUrl = res.locals.redirectUrl;
    // A stale redirect to the EV JSON endpoint would display raw JSON after login.
    delete req.session.redirectUrl;

    if (req.user?.accountType === 'Admin') {
        return req.logout((error) => {
            if (error) return res.redirect('/user/login');
            req.flash('error', 'Please use the administrator login page.');
            res.redirect('/user/admin/login');
        });
    }
    req.flash('success', 'Successfully logged in!');
    const isEvApiUrl = typeof redirectUrl === 'string' && /^\/services\/ev\/[^/?]+(?:\?.*)?$/.test(redirectUrl);
    res.redirect(isEvApiUrl ? '/campusAwaaz' : (redirectUrl || '/campusAwaaz'));
};

module.exports.renderAdminLogin = (req, res) => {
    if (req.user?.accountType === 'Admin') return res.redirect('/admin');
    res.render('users/adminLogin.ejs');
};

module.exports.adminLogin = (req, res, next) => {
    if (req.body.username) req.body.username = req.body.username.trim().toLowerCase();
    passport.authenticate('local', (error, user) => {
        if (error) return next(error);
        if (!user || user.accountType !== 'Admin') {
            req.flash('error', 'Invalid administrator email or password.');
            return res.redirect('/user/admin/login');
        }

        req.logIn(user, (loginError) => {
            if (loginError) return next(loginError);
            req.flash('success', 'Administrator signed in.');
            res.redirect('/admin');
        });
    })(req, res, next);
};
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Logged out successfully!');
        res.redirect('/campusAwaaz');
    });
};
module.exports.staffSignup = async (req, res, next) => {
    try {
        let { name, email, password, staffId, designation, hostel } = req.body;
        email = email.trim().toLowerCase();
        const newStaff = new User({
            name,
            email,
            username: email,
            accountType: 'Staff',
            staffId,
            designation,
            hostel,
        });
        const regStaff = await User.register(newStaff, password);
        req.login(regStaff, (err) => {
            if (err) {
                return next(err);
            }
            req.flash('success', 'Account registered successfully!');
            res.redirect('/campusAwaaz');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/user/signup');
    }
};
module.exports.renderProfile = async (req, res) => {
    const [roles, pendingRequests] = await Promise.all([
        RoleAssignment.find({ user: req.user._id }),
        RoleRequest.find({ user: req.user._id, status: 'Pending' }).sort({ createdAt: -1 }),
    ]);

    res.render('users/profile.ejs', {
        roles,
        pendingRequests,
    });
};
module.exports.requestCR = async (req, res) => {
    const user = req.user;

    if (user.accountType !== 'Student') {
        req.flash('error', 'Only students can request CR designation.');
        return res.redirect('/user/profile');
    }

    const classScope = {
        role: 'CR',
        branch: user.branch,
        year: user.year,
        section: user.section.toUpperCase(),
    };
    const [existingRole, existingRequest] = await Promise.all([
        RoleAssignment.findOne(classScope),
        RoleRequest.findOne({ user: user._id, ...classScope, status: 'Pending' }),
    ]);
    if (existingRole) {
        req.flash('error', 'Your class already has an approved CR.');
    } else if (existingRequest) {
        req.flash('error', 'Your CR request is already waiting for admin approval.');
    } else {
        await RoleRequest.create({ user: user._id, ...classScope });
        req.flash('success', 'Your CR request was sent to the admin for approval.');
    }

    res.redirect('/user/profile');
};
module.exports.requestGenSec = async (req, res) => {
    const user = req.user;
    const { club } = req.body;

    if (user.accountType !== 'Student') {
        req.flash('error', 'Only students can request GenSec designation.');
        return res.redirect('/user/profile');
    }

    if (!(user.clubs || []).includes(club)) {
        req.flash('error', 'You can only request GenSec for clubs you belong to.');
        return res.redirect('/user/profile');
    }

    const [existingRole, existingRequest] = await Promise.all([
        RoleAssignment.findOne({ role: 'GenSec', club }),
        RoleRequest.findOne({ user: user._id, role: 'GenSec', club, status: 'Pending' }),
    ]);
    if (existingRole) {
        req.flash('error', `${club} already has an approved GenSec.`);
    } else if (existingRequest) {
        req.flash('error', `Your GenSec request for ${club} is already waiting for admin approval.`);
    } else {
        await RoleRequest.create({ user: user._id, role: 'GenSec', club });
        req.flash('success', `Your GenSec request for ${club} was sent to the admin for approval.`);
    }

    res.redirect('/user/profile');
};
module.exports.relinquishRole = async (req, res) => {
    const { id } = req.params;

    const role = await RoleAssignment.findOneAndDelete({
        _id: id,
        user: req.user._id,
    });

    if (!role) {
        req.flash('error', 'Designation not found.');
    } else {
        const remainingRoles = await RoleAssignment.find({ user: req.user._id });
        if (req.user.studentRole === role.role) {
            req.user.studentRole = remainingRoles.some((item) => item.role === 'CR')
                ? 'CR'
                : remainingRoles.some((item) => item.role === 'GenSec')
                  ? 'GenSec'
                  : 'Student';
            await req.user.save();
        }
        req.flash('success', 'Designation relinquished successfully.');
    }

    res.redirect('/user/profile');
};
