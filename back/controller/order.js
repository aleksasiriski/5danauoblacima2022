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

router.post("/", async (req, res) => {
    try {
        const currencyPair = req.body.currencyPair.toUpperCase()
        const type = req.body.type.toUpperCase()
        const price = req.body.price
        const quantity = req.body.quantity

        if (currencyPair !== "BTCRSD") {
            res.status(400).json({
                message: "Wrong currency pair! Should be BTCRSD."
            })
        }
        if (type !== "BUY" && type !== "SELL") {
            res.status(400).json({
                message: "Wrong type! Should be BUY or SELL."
            })
        }
        if (price < 0) {
            res.status(400).json({
                message: "Wrong price! Should be equal or greater than 0."
            })
        }
        if (quantity < 0) {
            res.status(400).json({
                message: "Wrong quantity! Should be equal or greater than 0."
            })
        }

        const newOrder = new Order({
            currencyPair: currencyPair,
            type: type,
            price: price,
            quantity: quantity
        })
        const savedOrder = await newOrder.save()

        const orderbooks = Orderbook.find()
        let orderbook = new Orderbook()
        if (orderbooks !== []) {
            orderbook = orderbooks[0]
        }

        if (type === "BUY") {
            let pricePresent = false
            orderbook.buyOrders.forEach((buyOrder) => {
                if (!pricePresent && buyOrder.price === newOrder.price) {
                    buyOrder.quantity += newOrder.quantity
                    pricePresent = true
                }
            })
            if (!pricePresent) {
                orderbook.buyOrders.push({
                    price: price,
                    quantity: quantity
                })
            }
            orderbook.buyOrders.sort(function (x, y) {
                return x.price < y.price;
            })
        } else if (type === "SELL") {
            let pricePresent = false
            orderbook.sellOrders.forEach((sellOrder) => {
                if (!pricePresent && buyOrder.price === newOrder.price) {
                    sellOrder.quantity += newOrder.quantity
                    pricePresent = true
                }
            })
            if (!pricePresent) {
                orderbook.sellOrders.push({
                    price: price,
                    quantity: quantity
                })
            }
            orderbook.sellOrders.sort(function (x, y) {
                return x.price > y.price;
            })
        }

        await orderbook.save()

        res.status(201).json(savedOrder)
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