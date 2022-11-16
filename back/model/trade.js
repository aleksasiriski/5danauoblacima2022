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

tradeSchema.set("toObject", {
    transform: function (doc, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
    }
})

tradeSchema.pre("save", function (next) {
    this.updatedDateTime = new Date()
    next()
})

module.exports = mongoose.model("Trade", tradeSchema)