const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose').default;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    accountType: {
        type: String,
        enum: ['Student', 'Staff', 'Shopkeeper'],
        required: true,
        default: 'Student',
    },
    rollNo: {
        type: String,
        unique: true,
        sparse: true,
        required: function () {
            return this.accountType === 'Student';
        },
    },
    staffId: {
        type: String,
        unique: true,
        sparse: true,
        required: function () {
            return this.accountType === 'Staff';
        },
    },
    year: {
        type: Number,
        enum: [1, 2, 3, 4],
        required: function () {
            return this.accountType === 'Student';
        },
    },
    section: {
        type: String,
        required: function () {
            return this.accountType === 'Student';
        },
    },
    branch: {
        type: String,
        enum: [
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
        ],
        required: function () {
            return this.accountType === 'Student';
        },
    },
    hostel: {
        type: String,
        enum: ['LH', 'Blocks', '1.8k'],
        required: function () {
            return this.accountType === 'Student';
        },
    },
    clubs: [
        {
            type: String,
            enum: [
                'Aarohan',
                'Dance and Dramatics Club',
                'E-Cell',
                'Fine Arts Club',
                'IEEE Student Branch',
                'ISTE',
                'Literary Club',
                'Music Club',
                'Photography Club',
                'Quiz Club',
                'Robotics Club',
                'SAE',
                'SPIC MACAY',
                'Sports Club',
                'TEDx NIT Warangal',
            ],
        },
    ],
    designation: {
        type: String,
        required: function () {
            return this.accountType === 'Staff';
        },
    },
    studentRole: {
        type: String,
        enum: ['Student', 'CR', 'GenSec'],
        default: function () {
            return this.accountType === 'Student' ? 'Student' : undefined;
        },
        required: function () {
            return this.accountType === 'Student';
        },
    },
    roleRequest: {
        type: String,
        enum: ['CR', 'GenSec', null],
        default: null,
    },
    verified: {
        type: Boolean,
        default: false,
    },
});

userSchema.plugin(passportLocalMongoose, {
    usernameField: 'username',
});

module.exports = mongoose.model('User', userSchema);
