const RoleRequest = require('../models/roleRequest.js');
const RoleAssignment = require('../models/roles.js');

module.exports.roleRequests = async (req, res) => {
    const requests = await RoleRequest.find({ status: 'Pending' })
        .populate('user', 'name email rollNo branch year section clubs')
        .sort({ createdAt: 1 });

    res.render('admin/roleRequests.ejs', { requests });
};

module.exports.approveRoleRequest = async (req, res) => {
    const request = await RoleRequest.findOne({ _id: req.params.id, status: 'Pending' }).populate('user');
    if (!request || !request.user) {
        req.flash('error', 'That pending request could not be found.');
        return res.redirect('/admin/role-requests');
    }

    const assignmentScope =
        request.role === 'CR'
            ? {
                  role: 'CR',
                  branch: request.branch,
                  year: request.year,
                  section: request.section,
              }
            : { role: 'GenSec', club: request.club };

    const currentAssignment = await RoleAssignment.findOne(assignmentScope);
    if (currentAssignment && currentAssignment.user.toString() !== request.user._id.toString()) {
        req.flash('error', 'That class or club already has an approved designation.');
        return res.redirect('/admin/role-requests');
    }

    if (!currentAssignment) {
        await RoleAssignment.create({ user: request.user._id, ...assignmentScope });
    }

    if (request.role === 'CR') {
        request.user.studentRole = 'CR';
        await request.user.save();
    } else if (request.user.studentRole === 'Student') {
        request.user.studentRole = 'GenSec';
        await request.user.save();
    }

    request.status = 'Approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    req.flash('success', `${request.role} designation approved for ${request.user.name}.`);
    res.redirect('/admin/role-requests');
};

module.exports.rejectRoleRequest = async (req, res) => {
    const request = await RoleRequest.findOneAndUpdate(
        { _id: req.params.id, status: 'Pending' },
        { status: 'Rejected', reviewedBy: req.user._id, reviewedAt: new Date() },
        { new: true }
    ).populate('user', 'name');

    if (!request) {
        req.flash('error', 'That pending request could not be found.');
    } else {
        req.flash('success', `Request from ${request.user?.name || 'the student'} was rejected.`);
    }
    res.redirect('/admin/role-requests');
};
