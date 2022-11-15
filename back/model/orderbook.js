const mongoose = require("mongoose")

const orderbookSchema = new mongoose.Schema({
    buyOrders: [{
        type: String
    }], // list of objects type Order, type Buy
    sellOrders: [{
        type: String
    }], // list of objects type Order, type Sell
    createdDateTime: {
        type: Date,
        default: new Date()
    },
    updatedDateTime: {
        type: Date,
        default: new Date()
    }
}, { collection: "orderbooks" })

orderbookSchema.pre("save", function (next) {
    this.updatedDateTime = new Date()
    next()
})

module.exports = mongoose.model("Orderbook", orderbookSchema)