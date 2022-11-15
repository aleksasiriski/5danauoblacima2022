// imports
const express = require("express")
const router = express()
const Order = require("../model/order")
const Trade = require("../model/trade")
const Orderbook = require("../model/orderbook")

// endpoints
router.get("/:id", async (req, res) => {
    try {
        const orderId = req.params.id
        const requestedOrder = await Order.findById(orderId)
        res.status(200).json(requestedOrder)
    } catch (err) {
        res.status(404).json({
            message: err.message
        })
    }
})

// HERE !!!!!!!!!!!!!!!!!!!!!!!!!
router.post("/", async (req, res) => {
    try {
        const newOrder = new Order({
            id: req.body.id,
            currencyPair: req.body.currencyPair,
            type: req.body.type,
            price: req.body.price,
            quantity: req.body.quantity
        })
        res.status(201).json(newOrder)
    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }
})

router.delete("/all", async (req, res) => {
    try {
        await Order.deleteMany({})
        await Trade.deleteMany({})
        res.status(200)
    } catch(err) {
        res.status(403).json({
            message: err.message
        })
    }
})

// export
module.exports = router