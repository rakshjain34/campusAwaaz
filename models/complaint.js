const mongoose = require('mongoose');

const subcategories = {
    Hostel: [
        'Mess',
        'Lift',
        'Electricity, lights, fans and appliances',
        'Washrooms',
        'Other issues',
    ],
    'Common Buildings': ['Lift', 'Other issues'],
};

const complaintSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 150 },
        description: { type: String, required: true, trim: true, maxlength: 5000 },
        category: { type: String, enum: Object.keys(subcategories), required: true },
        subcategory: { type: String, required: true },
        location: {
            type: String,
            enum: ['', 'LH', '1.8k', 'E & ICT Building', 'ECE Department', 'Other Hostel', 'Other Common Building'],
            default: '',
        },
        urgency: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Medium',
            required: true,
        },
        visibility: {
            type: String,
            enum: ['Public', 'Private'],
            default: 'Public',
            required: true,
        },
        status: {
            type: String,
            enum: ['Unseen', 'Seen', 'In Process', 'Done'],
            default: 'Unseen',
            required: true,
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

        // Prevent repeated lift threshold notifications
        liftThresholdNotified: {
            type: Boolean,
            default: false,
        },

        updates: [
            {
                text: { type: String, required: true, trim: true, maxlength: 1000 },
                postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

complaintSchema.path('subcategory').validate(function (value) {
    return subcategories[this.category]?.includes(value);
}, 'Choose a subcategory valid for the selected category.');

complaintSchema.path('location').validate(function (value) {
    if (this.subcategory === 'Lift' && !value) return false;
    if (!value) return true;

    const hostelLocations = ['LH', '1.8k', 'Other Hostel'];
    const commonBuildingLocations = ['E & ICT Building', 'ECE Department', 'Other Common Building'];
    return this.category === 'Hostel'
        ? hostelLocations.includes(value)
        : this.category === 'Common Buildings' && commonBuildingLocations.includes(value);
}, 'Choose a location valid for the complaint category. Lift complaints need a location.');

complaintSchema.index({ visibility: 1, category: 1, subcategory: 1, urgency: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
