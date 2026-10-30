const User = require('../models/user.js');
const RoleAssignment = require('../models/roles.js');
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
            roleRequest: null,
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
    req.flash('success', 'Successfully logged in!');
    res.redirect(res.locals.redirectUrl || '/campusAwaaz');
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
    const RoleAssignment = require('../models/roles.js');

    const roles = await RoleAssignment.find({
        user: req.user._id,
    });

    res.render('users/profile.ejs', {
        roles,
    });
};
module.exports.requestCR = async (req, res) => {
    const user = req.user;

    if (user.accountType !== 'Student') {
        req.flash('error', 'Only students can request CR designation.');
        return res.redirect('/user/profile');
    }

    try {
        await RoleAssignment.create({
            user: user._id,
            role: 'CR',
            branch: user.branch,
            year: user.year,
            section: user.section.toUpperCase(),
        });

        req.flash('success', 'Congratulations! You are now the CR of your class.');
    } catch (err) {
        if (err.code === 11000) {
            req.flash('error', 'Your class already has a CR.');
        } else {
            throw err;
        }
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

    if (!user.clubs.includes(club)) {
        req.flash('error', 'You can only request GenSec for clubs you belong to.');
        return res.redirect('/user/profile');
    }

    try {
        await RoleAssignment.create({
            user: user._id,
            role: 'GenSec',
            club,
        });

        req.flash('success', `You are now GenSec of ${club}!`);
    } catch (err) {
        if (err.code === 11000) {
            req.flash('error', `${club} already has a GenSec.`);
        } else {
            throw err;
        }
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
        req.flash('success', 'Designation relinquished successfully.');
    }

    res.redirect('/user/profile');
};
