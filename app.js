// npm init -y
// npm i express ejs mongoose method-override ejs-mate cookie-parser express-session connect-flash 
// npm i passport passport-local passport-local-mongoose multer dotenv cloudinary@1.41.3 multer-storage-cloudinary @mapbox/mapbox-sdk

if(process.env.NODE_ENV != "production" ){
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError.js");
const passport = require("passport");
const LocalStartegy = require("passport-local");
const User = require("./models/user.js");
const users = require("./routes/user.js");

const Announcement = require("./models/announcement.js");
const announcements = require("./routes/announcement.js");

const port = 8080;
const sessionOptions = {
    secret: process.env.SESSION_SECRET || "code",
    resave: false,
    saveUninitialized : true,
    cookie : {
        maxAge: 1000*60*60*24*3, //3days
        httpOnly: true,
    }
};

// View Engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStartegy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// before domains
app.use((req,res,next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

//announcements
app.use("/announcements", announcements);

// Database Connection
main()
    .then(() => console.log("Connection successful"))
    .catch((err) => console.log(err));
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/campusAwaaz");
}

// Root Route
app.get("/", (req, res) => {
    res.redirect("/campusAwaaz");
});

//Home Route
app.get("/campusAwaaz", (req, res) => {
    res.render("pages/home.ejs");
});



// User Routes
app.use("/user", users);

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// Error Handler
app.use((err, req, res, next) => {
    console.error("ERROR:", err.stack || err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.statusCode || 500).send(err.message || "Something went wrong!");
});
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).send(message);
});

// Start Server
app.listen(port, () => {
    console.log(`CampusAwaaz running on port ${port}`);
});