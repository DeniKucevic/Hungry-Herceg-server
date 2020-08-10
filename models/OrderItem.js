const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
    orderId: {
      type: mongoose.Types.ObjectId,
      required: true
    },
    user: {
      type: String,
      required: true
    },
    meal: {
      type: mongoose.Types.ObjectId,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    note: String
});

module.exports = mongoose.model("OrderItem", orderItemSchema);
