// npm init -y
// npm i express ejs mongoose method-override ejs-mate cookie-parser express-session connect-flash
// npm i passport passport-local passport-local-mongoose multer dotenv cloudinary@1.41.3 multer-storage-cloudinary @mapbox/mapbox-sdk

if (process.env.NODE_ENV != 'production') {
    require('dotenv').config();
}

require('dns').setServers(['1.1.1.1', '1.0.0.1']);
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError.js');
const passport = require('passport');
const LocalStartegy = require('passport-local');
const User = require('./models/user.js');
const users = require('./routes/user.js');
const complaints = require('./routes/complaint.js');

const lostfounds = require('./routes/lostfound.js');

const Announcement = require('./models/announcement.js');
const Complaint = require('./models/complaint.js');
const LostFound = require('./models/lostfound.js');
const announcements = require('./routes/announcement.js');
const timetables = require('./routes/timetables.js');
const port = 8080;
const sessionOptions = {
    secret: process.env.SESSION_SECRET || 'code',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 3, //3days
        httpOnly: true,
    },
};

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.currentPath = req.path;
    next();
});

passport.use(new LocalStartegy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// before domains
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
    next();
});

//announcements
app.use('/announcements', announcements);
//complaints
app.use('/complaints', complaints);
//lostfound
app.use('/lostfound', lostfounds);
//timtetables
app.use('/timetables', timetables);
// Database Connection
main()
    .then(() => console.log('Connection successful'))
    .catch((err) => console.log(err));
async function main() {
    await mongoose.connect(process.env.ATLASDB_URL);
    console.log('Connected to MongoDB Atlas!');
}

// Root Route
app.get('/', (req, res) => {
    res.redirect('/campusAwaaz');
});

//Home Route
app.get('/campusAwaaz', async (req, res, next) => {
    try {
        const user = req.user;
        const validFeeds = ['for-you', 'trending', 'campus-life'];
        const activeFeed = validFeeds.includes(req.query.feed) ? req.query.feed : 'for-you';
        const now = new Date();

        const complaintVisibility =
            user?.accountType === 'Staff'
                ? {}
                : {
                      $or: user
                          ? [{ visibility: 'Public' }, { createdBy: user._id }]
                          : [{ visibility: 'Public' }],
                  };
        const currentComplaintFilter = {
            $and: [{ status: { $ne: 'Done' } }, complaintVisibility],
        };

        const announcementScopes = [{ scope: 'College' }];
        if (user?.accountType === 'Student') {
            announcementScopes.push({
                scope: 'Class',
                branch: user.branch,
                year: user.year,
                section: user.section,
            });
            if (user.clubs?.length) {
                announcementScopes.push({ scope: 'Club', club: { $in: user.clubs } });
            }
        }
        const announcementVisibility = { $or: announcementScopes };
        const announcementExpiry = {
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        };
        const visibleAnnouncementFilter = {
            $and: [announcementVisibility, announcementExpiry],
        };

        const currentComplaints = await Complaint.find(currentComplaintFilter)
            .populate('createdBy', 'name branch')
            .sort({ createdAt: -1 })
            .limit(8);

        const trendingComplaints = await Complaint.aggregate([
            {
                $match: {
                    visibility: 'Public',
                    status: { $ne: 'Done' },
                    'upvotes.5': { $exists: true },
                },
            },
            { $addFields: { upvoteCount: { $size: { $ifNull: ['$upvotes', []] } } } },
            { $sort: { upvoteCount: -1, createdAt: -1 } },
            { $limit: 5 },
        ]);
        await Complaint.populate(trendingComplaints, { path: 'createdBy', select: 'name branch' });

        const campusAnnouncements = await Announcement.find(visibleAnnouncementFilter)
            .populate('postedBy', 'name accountType')
            .sort({ isPinned: -1, createdAt: -1 })
            .limit(8);

        const campusDateParts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(now);
        const campusDate = Object.fromEntries(campusDateParts.map(({ type, value }) => [type, value]));
        const today = new Date(Date.UTC(
            Number(campusDate.year),
            Number(campusDate.month) - 1,
            Number(campusDate.day)
        ));
        const upcomingEvents = await Announcement.find({
            $and: [
                visibleAnnouncementFilter,
                { category: 'Events', eventDate: { $gte: today } },
            ],
        })
            .populate('postedBy', 'name accountType')
            .sort({ eventDate: 1, createdAt: -1 })
            .limit(4);

        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const [openComplaintCount, reunitedItemCount, newNoticeCount] = await Promise.all([
            Complaint.countDocuments(currentComplaintFilter),
            LostFound.countDocuments({ status: 'Resolved' }),
            Announcement.countDocuments({
                $and: [visibleAnnouncementFilter, { createdAt: { $gte: weekAgo } }],
            }),
        ]);

        res.render('pages/home.ejs', {
            activeFeed,
            currentComplaints,
            trendingComplaints,
            campusAnnouncements,
            upcomingEvents,
            openComplaintCount,
            reunitedItemCount,
            newNoticeCount,
        });
    } catch (error) {
        next(error);
    }
});

// User Routes
app.use('/user', users);

// Services Routes
const services = require('./routes/services.js');
app.use('/services', services);

app.use((req, res, next) => {
    console.log('404 REQUEST:', req.method, req.originalUrl);
    next(new ExpressError(404, 'Page Not Found'));
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('ERROR:', err.stack || err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.statusCode || 500).send(err.message || 'Something went wrong!');
});
app.use((err, req, res, next) => {
    let { statusCode = 500, message = 'Something went wrong!' } = err;
    res.status(statusCode).send(message);
});

// Start Server
app.listen(port, () => {
    console.log(`CampusAwaaz running on port ${port}`);
});
