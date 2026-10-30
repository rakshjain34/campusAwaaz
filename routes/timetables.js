const express = require('express');
const router = express.Router();

const wrapAsync = require('../utils/wrapAsync.js');

const timetableController = require('../controllers/timetables.js');

const { isLoggedIn } = require('../middleware.js');

const upload = require('../middleware/upload.js');

const isTimetableAuthor = async (req, res, next) => {
    const Timetable = require('../models/timetable.js');

    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
        req.flash('error', 'Resource not found.');
        return res.redirect('/timetables');
    }

    if (timetable.uploadedBy.toString() !== req.user._id.toString()) {
        req.flash('error', 'You cannot modify this resource.');
        return res.redirect('/timetables');
    }

    res.locals.timetable = timetable;

    next();
};

router.get('/', isLoggedIn, wrapAsync(timetableController.index));

router.get('/mine', isLoggedIn, wrapAsync(timetableController.mine));

router.get('/new', isLoggedIn, wrapAsync(timetableController.renderNewForm));

router.post('/', isLoggedIn, upload.single('attachment'), wrapAsync(timetableController.create));

router.get(
    '/:id/edit',
    isLoggedIn,
    wrapAsync(isTimetableAuthor),
    wrapAsync(timetableController.renderEditForm)
);

router.get('/:id', isLoggedIn, wrapAsync(timetableController.show));

router.put(
    '/:id',
    isLoggedIn,
    wrapAsync(isTimetableAuthor),
    upload.single('attachment'),
    wrapAsync(timetableController.update)
);

router.delete(
    '/:id',
    isLoggedIn,
    wrapAsync(isTimetableAuthor),
    wrapAsync(timetableController.delete)
);

module.exports = router;
