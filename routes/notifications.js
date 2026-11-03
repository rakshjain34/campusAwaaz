const express = require('express');
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn } = require('../middleware.js');
const controller = require('../controllers/notifications.js');

const router = express.Router();

router.use(isLoggedIn);
router.get('/', wrapAsync(controller.index));
router.post('/read-all', wrapAsync(controller.markAllRead));
router.get('/:id/open', wrapAsync(controller.open));

module.exports = router;
