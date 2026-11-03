const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        complaint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Complaint',
            default: null,
        },
        announcement: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Announcement',
            default: null,
        },
        notificationType: {
            type: String,
            enum: ['Complaint', 'Announcement'],
            default: 'Complaint',
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
