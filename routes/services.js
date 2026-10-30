const express = require('express');
const router = express.Router();

const wrapAsync = require('../utils/wrapAsync.js');
const shopController = require('../controllers/shops.js');

const { isLoggedIn, isShopkeeper } = require('../middleware.js');

router.get('/', wrapAsync(shopController.index));

router.get('/new', isLoggedIn, isShopkeeper, shopController.renderNewForm);

router.post('/', isLoggedIn, isShopkeeper, wrapAsync(shopController.createShop));

router.post('/:id/status', isLoggedIn, isShopkeeper, wrapAsync(shopController.updateStatus));
module.exports = router;
