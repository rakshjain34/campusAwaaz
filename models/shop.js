
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const shopSchema = new Schema({
    shopkeeper: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    shopName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    timings: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isOpen: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("Shop", shopSchema);
