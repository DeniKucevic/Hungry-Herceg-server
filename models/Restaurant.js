const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// if one of required properties is not provided, poll will not be created
const restaurantSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    tags: [
        {
            type: String,
            required: true
        }
    ],
    meals: [
        {
            type: mongoose.Types.ObjectId,
            required: true
        }
    ]

});

module.exports = mongoose.model('Restaurant', restaurantSchema);