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
    },
    updatedDateTime: {
        type: Date,
        default: new Date()
    }
}, { collection: "orderbooks" })

orderbookSchema.set("toObject", {
    transform: function (doc, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
    }
})

orderbookSchema.pre("save", function (next) {
    this.updatedDateTime = new Date()
    next()
})

module.exports = mongoose.model("Orderbook", orderbookSchema)