const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    currencyPair: {
        type: String,
        default: "BTCUSD",
        set(value) {
            return this.currencyPair;
        },
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
    }, // 2 decimal points
    quantity: {
        type: Number,
        required: true,
        min: 0
    }, // 2 decimal points
    filledQuantity: {
        type: Number,
        required: true,
        min: 0
    }, // 2 decimal points
    status: {
        type: String,
        default: "OPEN",
        enum: ["OPEN", "CLOSED"]
    },
    trades: [{
        type: String
    }], // list of objects type Trade
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