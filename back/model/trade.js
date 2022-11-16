const mongoose = require("mongoose")

const tradeSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true
    },
    buyOrderId: {
        type: Number,
        required: true
    },
    sellOrderId: {
        type: Number,
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
    timestamp: {
        type: Date,
        default: new Date()
    }
}, {versionKey: false}, { collection: "trades" })

tradeSchema.pre("save", function (next) {
    this.id = this._id
    next()
})

module.exports = mongoose.model("Trade", tradeSchema)