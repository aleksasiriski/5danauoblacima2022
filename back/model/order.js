const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    currencyPair: {
        type: String,
        required: true,
        default: "BTCUSD"
    },
    type: {
        type: String,
        required: true,
        enum: ["BUY", "SELL"]
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    filledQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        default: "OPEN",
        enum: ["OPEN", "CLOSED"]
    },
    trades: [String],
    createdDateTime: {
        type: Date,
        default: new Date()
    },
    updatedDateTime: {
        type: Date,
        default: new Date()
    }
}, { collection: "orders" })

orderSchema.pre("save", function (next) {
    this.updatedDateTime = new Date()
    next()
})

module.exports = mongoose.model("Order", orderSchema)