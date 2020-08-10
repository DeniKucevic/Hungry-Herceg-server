const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  pollId: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  restaurantId: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  createdAt: {
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
  orderItemList: [
    {
      type: mongoose.Types.ObjectId,
      required: true
    }
  ]
});

module.exports = mongoose.model("Order", orderSchema);
