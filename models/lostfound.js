const mongoose = require('mongoose');

const lostFoundSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        itemType: {
            type: String,
            enum: ['Lost', 'Found'],
            required: true,
        },
        category: {
            type: String,
            enum: ['Electronics', 'ID Card', 'Books', 'Clothing', 'Accessories', 'Other'],
            required: true,
        },
        color: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        specifications: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: Date,
            required: true,
        },
        image: {
            type: String,
            default: '',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['Active', 'Resolved'],
            default: 'Active',
        },
    },
    { timestamps: true }
);

lostFoundSchema.index({ itemType: 1, category: 1, status: 1 });

module.exports = mongoose.model('LostFound', lostFoundSchema);
