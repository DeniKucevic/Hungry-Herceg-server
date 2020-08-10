const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// if one of required properties is not provided, poll will not be created
const pollSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    createdAt: {
        type: String,
        required: true
    },
    ends: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        required: true
    },
    restaurants: [
        {
            restaurantId: {
                type: mongoose.Types.ObjectId,
                required: true   
            },
            votes: [
                {
                    type: mongoose.Types.ObjectId,
                    required: true
                }
            ]
        }
    ]
});

module.exports = mongoose.model('Poll', pollSchema);