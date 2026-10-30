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

const timetableSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },

        category: {
            type: String,
            enum: [
                'Mess Menu',
                'Class Timetable',
                'Academic Calendar',
                'Exam Schedule',
                'Holiday List',
                'Other',
            ],
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

        attachment: {
            type: String,
            required: true,
        },

        attachmentPublicId: {
            type: String,
            required: true,
        },

        attachmentType: {
            type: String,
            enum: ['image', 'file'],
            required: true,
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

timetableSchema.index({ category: 1, createdAt: -1 });
timetableSchema.index({ scope: 1, createdAt: -1 });
timetableSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Timetable', timetableSchema);
