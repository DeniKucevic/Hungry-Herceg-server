const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const mealSchema = new Schema({
    restaurantId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    tag: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Meal', mealSchema);