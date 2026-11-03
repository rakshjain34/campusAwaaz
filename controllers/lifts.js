const Complaint = require('../models/complaint.js');

const liftLocations = [
    {
        id: 'lh',
        value: 'LH',
        label: 'LH',
        category: 'Hostel',
        complaintUrl: '/complaints?category=Hostel&subcategory=Lift',
        legacyPatterns: [/\blh\b/i, /ladies\s+hostel/i],
    },
    {
        id: '1-8k',
        value: '1.8k',
        label: '1.8k',
        category: 'Hostel',
        complaintUrl: '/complaints?category=Hostel&subcategory=Lift',
        legacyPatterns: [/\b1\.8\s*k\b/i, /\b1800\b/i],
    },
    {
        id: 'e-ict',
        value: 'E & ICT Building',
        label: 'E & ICT Building',
        category: 'Common Buildings',
        complaintUrl: '/complaints?category=Common+Buildings&subcategory=Lift',
        legacyPatterns: [/\be\s*(?:&|and)\s*ict\b/i, /\be-ict\b/i],
    },
    {
        id: 'ece',
        value: 'ECE Department',
        label: 'ECE Department',
        category: 'Common Buildings',
        complaintUrl: '/complaints?category=Common+Buildings&subcategory=Lift',
        legacyPatterns: [/\bece\s*(?:dept|department)\b/i],
    },
];

const isForLocation = (complaint, location) => {
    if (complaint.category !== location.category) return false;
    if (complaint.location) return complaint.location === location.value;

    // Older complaints have no dedicated location field, so check their text as a fallback.
    const oldReportText = `${complaint.title || ''} ${complaint.description || ''}`;
    return location.legacyPatterns.some((pattern) => pattern.test(oldReportText));
};

module.exports.getLiftStatuses = async () => {
    const qualifyingComplaints = await Complaint.find({
        category: { $in: ['Hostel', 'Common Buildings'] },
        subcategory: 'Lift',
        visibility: 'Public',
        status: { $ne: 'Done' },
        'upvotes.3': { $exists: true },
    }).select('category location title description');

    return liftLocations.map((location) => ({
        id: location.id,
        location: location.label,
        complaintUrl: location.complaintUrl,
        status: qualifyingComplaints.some((complaint) => isForLocation(complaint, location))
            ? 'Broken'
            : 'Working',
    }));
};

module.exports.status = async (req, res) => {
    res.json({ liftStatuses: await module.exports.getLiftStatuses() });
};
