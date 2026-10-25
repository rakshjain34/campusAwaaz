const express = require("express");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js")
// const {userSchema} = require("../schema.js");
const User = require("../models/user.js");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn} = require("../middleware.js");
const router = express.Router();
const userController = require("../controllers/users.js");

router
    .route("/signup")
    .get(userController.renderSignup)
    .post(wrapAsync(userController.signup));

router
    .route("/login")
    .get( userController.renderLogin)
    .post(saveRedirectUrl , passport.authenticate("local", { failureRedirect: "/user/login", failureFlash: true}) , userController.login);

router
    .route("/signup/staff")
    .get(userController.renderStaffSignup)
    .post(wrapAsync(userController.staffSignup))
    
router
    .route("/signup/shopkeeper")
    .get(userController.renderShopkeeperSignup)
    .post(wrapAsync(userController.shopkeeperSignup));
router.post("/logout", userController.logout);
module.exports = router;