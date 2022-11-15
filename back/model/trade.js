const mongoose = require("mongoose")

const tradeSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    buyOrderId: {
        type: String,
        required: true
    },
    sellOrderId: {
        type: String,
        required: true
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
    createdDateTime: {
        type: Date,
        default: new Date()
    },
    updatedDateTime: {
        type: Date,
        default: new Date()
    }
}, { collection: "trades" })

tradeSchema.pre("save", function (next) {
    this.updatedDateTime = new Date()
    next()
})

module.exports = mongoose.model("Trade", tradeSchema)