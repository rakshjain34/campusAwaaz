
const EV = require('../models/ev.js');

// Show one EV's latest location
module.exports.show = async (req, res) => {
    const ev = await EV.findById(req.params.id);

    if (!ev) {
        return res.status(404).json({ message: 'EV not found' });
    }

    res.json(ev);
};

// Update EV location
module.exports.updateLocation = async (req, res) => {
    const { latitude, longitude } = req.body;

    if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
    ) {
        return res.status(400).json({ message: 'Invalid GPS coordinates' });
    }

    const ev = await EV.findById(req.params.id);

    if (!ev) {
        return res.status(404).json({ message: 'EV not found' });
    }

    ev.latitude = latitude;
    ev.longitude = longitude;
    ev.status = 'Moving';
    ev.isTracking = true;
    ev.lastUpdated = new Date();

    await ev.save();

    res.json({ message: 'Location updated successfully' });
};
module.exports.stopTracking = async (req, res) => {
    const ev = await EV.findById(req.params.id);

    if (!ev) {
        return res.status(404).json({ message: 'EV not found' });
    }

    ev.isTracking = false;
    ev.status = 'Stopped';
    ev.lastUpdated = new Date();

    await ev.save();

    res.json({ message: 'Tracking stopped successfully' });
};
