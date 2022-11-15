// imports
const express = require("express")
const router = express()
const Orderbook = require("../model/orderbook")

// endpoints
router.get("/", async (req, res) => {
    try {
        const orderbooks = Orderbook.find()
        let orderbook = new Orderbook()
        if (orderbooks !== []) {
            orderbook = orderbooks[0]
        } else {
            await orderbook.save()
        }
        res.status(200).json(orderbook)
    } catch (err) {
        res.status(404).json({
            message: err.message
        })
    }
})

// export
module.exports = router