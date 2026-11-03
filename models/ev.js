
const mongoose = require('mongoose');

const evSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    vehicleNumber: {
        type: String,
        required: true,
        unique: true
    },

    latitude: {
        type: Number,
        default: null
    },

    longitude: {
        type: Number,
        default: null
    },

    status: {
        type: String,
        enum: ['Moving', 'Stopped', 'Offline'],
        default: 'Offline'
    },

    isTracking: {
        type: Boolean,
        default: false
    },

    lastUpdated: {
        type: Date,
        default: null
    }
});

const EV = mongoose.model('EV', evSchema);

module.exports = EV;
