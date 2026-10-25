const mongoose = require("mongoose");

const branches = [
    "CSE",
    "CSE (AI & DS)",
    "MNC",
    "ECE",
    "EEE",
    "Mechanical",
    "Civil",
    "Chemical",
    "Biotechnology",
    "Metallurgical and Materials Engineering"
];

const announcementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        },
        category: {
            type: String,
            enum: [
                "Academic",
                "Events",
                "Clubs",
                "Hostel",
                "Placement",
                "General"
            ],
            default: "General",
            required: true
        },
        targetTypes: {
            type: [{
                type: String,
                enum: ["Student", "Staff", "Everyone"]
            }],
            required: true,
            validate: {
                validator: function (value) {
                    return Array.isArray(value) && value.length > 0;
                },
                message: "Select at least one audience."
            }
        },
        staffAudience: {
            type: [{
                type: String,
                enum: ["All", "Wardens"]
            }],
            default: ["All"]
        },
        branches: {
            type: [{
                type: String,
                enum: branches
            }],
            default: []
        },
        years: {
            type: [{
                type: Number,
                enum: [1, 2, 3, 4]
            }],
            default: []
        },
        sections: {
            type: [{
                type: String,
                enum: ["A", "B", "C", "D"]
            }],
            default: []
        },
        priority: {
            type: String,
            enum: ["Normal", "Important", "Urgent"],
            default: "Normal"
        },
        attachment: {
            type: String,
            default: ""
        },
        attachmentType: {
            type: String,
            enum: ["image", "file", ""],
            default: ""
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        isPinned: {
            type: Boolean,
            default: false
        },
        expiresAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

announcementSchema.index({
    title: "text",
    description: "text"
});

module.exports = mongoose.model("Announcement", announcementSchema);