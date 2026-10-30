const mongoose = require('mongoose');

const roleAssignmentSchema = new mongoose.Schema(
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
        branch: {
            type: String,
        },
        year: {
            type: Number,
        },
        section: {
            type: String,
        },
        club: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Only one CR per class
roleAssignmentSchema.index(
    { branch: 1, year: 1, section: 1 },
    {
        unique: true,
        partialFilterExpression: { role: 'CR' },
    }
);

// Only one GenSec per club
roleAssignmentSchema.index(
    { club: 1 },
    {
        unique: true,
        partialFilterExpression: { role: 'GenSec' },
    }
);

module.exports = mongoose.model('RoleAssignment', roleAssignmentSchema);
