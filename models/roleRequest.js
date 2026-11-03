const mongoose = require('mongoose');

const roleRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['CR', 'GenSec'],
            required: true,
        },
        branch: String,
        year: Number,
        section: String,
        club: String,
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
            required: true,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: Date,
    },
    { timestamps: true }
);

roleRequestSchema.index(
    { user: 1, role: 1, branch: 1, year: 1, section: 1 },
    { unique: true, partialFilterExpression: { role: 'CR', status: 'Pending' } }
);
roleRequestSchema.index(
    { user: 1, role: 1, club: 1 },
    { unique: true, partialFilterExpression: { role: 'GenSec', status: 'Pending' } }
);

module.exports = mongoose.model('RoleRequest', roleRequestSchema);
