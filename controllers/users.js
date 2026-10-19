const User = require("../models/user.js");

module.exports.renderSignup = (req, res) => {
    res.render("users/signup.ejs");
};
module.exports.renderStaffSignup = (req, res) => {
    res.render("users/staffSignup.ejs");
};
module.exports.signup = async (req, res, next) => {
    try {
        let {
            name,
            email,
            password,
            rollNo,
            year,
            section,
            branch,
            hostel,
            clubs
        } = req.body;

        // let { username, email, password } = req.body;
        // const newUser = new User({ email, username });

        const newUser = new User({
            name,
            email,
            username: email,
            accountType: "Student",
            rollNo,
            year,
            section,
            branch,
            hostel,
            clubs: clubs || [],
            studentRole: "Student"
        });
        const regUser = await User.register(newUser, password);
        req.login(regUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Account registered successfully!");
            res.redirect("/campusAwaaz");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/user/signup");
    }
};

module.exports.staffSignup = async (req, res, next) => {
    try {
        let {
            name,
            email,
            password,
            staffId,
            designation,
            hostel
        } = req.body;

        // let { username, email, password } = req.body;
        // const newUser = new User({ email, username });

        const newStaff = new User({
            name,
            email,
            username: email,
            accountType: "Staff",
            staffId,
            designation,
            hostel,
        });
        const regStaff = await User.register(newStaff, password);
        req.login(regStaff, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Account registered successfully!");
            res.redirect("/campusAwaaz");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/user/signup");
    }
};
module.exports.renderLogin = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    req.flash("success", "Successfully logged in!");
    res.redirect(res.locals.redirectUrl || "/campusAwaaz");
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Logged out successfully!");
        res.redirect("/campusAwaaz");
    });
};