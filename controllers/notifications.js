const Notification = require('../models/notification.js');

module.exports.index = async (req, res) => {
    const [notifications, unreadCount] = await Promise.all([
        Notification.find({ recipient: req.user._id })
            .populate('announcement', 'title category club scope')
            .populate('complaint', 'title category subcategory status')
            .sort({ createdAt: -1 })
            .limit(100),
        Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.render('notifications/index.ejs', {
        notifications,
        unreadCount,
    });
};

module.exports.open = async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        recipient: req.user._id,
    });

    if (!notification) {
        req.flash('error', 'Notification not found.');
        return res.redirect('/notifications');
    }

    if (!notification.isRead) {
        notification.isRead = true;
        await notification.save();
    }

    if (notification.announcement) {
        return res.redirect(`/announcements/${notification.announcement}`);
    }
    if (notification.complaint) {
        return res.redirect(`/complaints/${notification.complaint}`);
    }

    res.redirect('/notifications');
};

module.exports.markAllRead = async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );
    req.flash('success', 'All notifications marked as read.');
    res.redirect('/notifications');
};
