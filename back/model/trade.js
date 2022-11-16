const mongoose = require("mongoose")

const tradeSchema = new mongoose.Schema({
    id: {
        type: String,
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
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
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
    this.id = this._id
    this.updatedDateTime = new Date()
    next()
})

module.exports = mongoose.model("Trade", tradeSchema)