const mongoose = require("mongoose")

const orderbookSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true
    },
    buyOrders: [{
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    sellOrders: [{
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    createdDateTime: {
        type: Date,
        default: new Date()
    }
}, {versionKey: false}, { collection: "orderbooks" })

orderbookSchema.pre("save", function (next) {
    this.id = this._id
    next()
})

module.exports = mongoose.model("Orderbook", orderbookSchema)