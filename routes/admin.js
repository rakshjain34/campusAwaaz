const express = require('express');
const wrapAsync = require('../utils/wrapAsync.js');
const { isAdmin } = require('../middleware.js');
const controller = require('../controllers/admin.js');

const router = express.Router();
router.use(isAdmin);

router.get('/', (req, res) => res.redirect('/admin/role-requests'));
router.get('/role-requests', wrapAsync(controller.roleRequests));
router.post('/role-requests/:id/approve', wrapAsync(controller.approveRoleRequest));
router.post('/role-requests/:id/reject', wrapAsync(controller.rejectRoleRequest));

module.exports = router;
