const express = require('express');
const router = express.Router();

const wrapAsync = require('../utils/wrapAsync.js');
const shopController = require('../controllers/shops.js');
const evController = require('../controllers/ev.js');

const { isLoggedIn, isShopkeeper, isStaff } = require('../middleware.js');

// Display Campus Services
router.get('/', wrapAsync(shopController.index));

// Shop routes
router.get('/new', isLoggedIn, isShopkeeper, shopController.renderNewForm);

router.post('/', isLoggedIn, isShopkeeper, wrapAsync(shopController.createShop));

router.post('/:id/status', isLoggedIn, isShopkeeper, wrapAsync(shopController.updateStatus));

// EV routes
router.get('/ev/:id', isLoggedIn, wrapAsync(evController.show));

router.post('/ev/:id/location', isLoggedIn, isStaff, wrapAsync(evController.updateLocation));

router.post('/ev/:id/stop', isLoggedIn, isStaff, wrapAsync(evController.stopTracking));

module.exports = router;