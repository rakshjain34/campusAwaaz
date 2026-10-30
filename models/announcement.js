const mongoose = require('mongoose');

const branches = [
    'CSE',
    'CSE (AI & DS)',
    'MNC',
    'ECE',
    'EEE',
    'Mechanical',
    'Civil',
    'Chemical',
    'Biotechnology',
    'Metallurgical and Materials Engineering',
];

const announcementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },

        category: {
            type: String,
            enum: ['Academic', 'Events', 'Clubs', 'Hostel', 'Placement', 'Examinations', 'General'],
            default: 'General',
            required: true,
        },

        scope: {
            type: String,
            enum: ['College', 'Class', 'Club'],
            required: true,
        },

        publisherRole: {
            type: String,
            enum: ['Staff', 'CR', 'GenSec'],
            required: true,
        },

        branch: {
            type: String,
            enum: branches,
        },

        year: {
            type: Number,
            enum: [1, 2, 3, 4],
        },

        section: {
            type: String,
            enum: ['A', 'B', 'C', 'D'],
        },

        club: {
            type: String,
            trim: true,
        },

        priority: {
            type: String,
            enum: ['Normal', 'Important', 'Urgent'],
            default: 'Normal',
        },

        attachment: {
            type: String,
            default: '',
        },

        attachmentPublicId: {
            type: String,
            default: '',
        },

        attachmentType: {
            type: String,
            enum: ['image', 'file', ''],
            default: '',
        },

        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        isPinned: {
            type: Boolean,
            default: false,
        },

        expiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

announcementSchema.index({
    title: 'text',
    description: 'text',
});

announcementSchema.index({
    scope: 1,
    createdAt: -1,
});

announcementSchema.index({
    postedBy: 1,
    createdAt: -1,
});

module.exports = mongoose.model('Announcement', announcementSchema);
