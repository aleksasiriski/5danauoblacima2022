// imports
const express = require("express")
const router = express()
const Order = require("../model/order")
const Trade = require("../model/trade")
const Orderbook = require("../model/orderbook")
const methodOverride = require("method-override")

router.use(methodOverride("_method"))

// endpoints
router.get("/", async (req, res) => {
    try {
        const requestedOrders = await Order.find()
        res.status(200).json(requestedOrders)
    } catch (err) {
        res.status(404).json({
            message: err.message
        })
    }
})

router.get("/:id", async (req, res) => {
    try {
        const requestedOrder = await Order.findOne({"id": `${req.params.id}`})
        res.status(200).json(requestedOrder)
    } catch (err) {
        res.status(404).json({
            message: err.message
        })
    }
})

async function checkBuyable(newOrder) {
    let success = false
    Order.find({orderStatus: "OPEN"}).lean().exec(await async function (err, orders) {
        orders.sort((a, b) => {
            return a.price == b.price ? a.createdDateTime < b.createdDateTime : a.price < b.price
        })
        let askedQuantity = newOrder.quantity
        orders.forEach(async (order) => {
            console.log(order)
            if (order.type === "SELL" && order.orderStatus === "OPEN") {
                if (order.price <= newOrder.price) {
                    const leftQuantity = order.quantity - order.filledQuantity
                    if (leftQuantity >= askedQuantity) {
                        order.filledQuantity += askedQuantity
                        if (order.filledQuantity == order.quantity) {
                            order.orderStatus = "CLOSED"
                        }
                        let newTrade = await new Trade({
                            buyOrderId: newOrder.id,
                            sellOrderId: order.id,
                            price: order.price,
                            quantity: askedQuantity
                        }).save()
                        newOrder.trades.push(newTrade.id)
                        order.trades.push(newTrade.id)
                        await order.save()
                        success = true
                    } else {
                        askedQuantity -= leftQuantity
                        order.filledQuantity = order.quantity
                        order.orderStatus = "CLOSED"
                        let newTrade = await new Trade({
                            buyOrderId: newOrder.id,
                            sellOrderId: order.id,
                            price: order.price,
                            quantity: leftQuantity
                        }).save()
                        newOrder.trades.push(newTrade.id)
                        order.trades.push(newTrade.id)
                        await order.save()
                    }
                }
            }
        })
    })
    if (success) {
        await newOrder.save()
    }
    return success
}

async function checkSellable(newOrder) {
    Order.find({orderStatus: "OPEN"}).lean().exec(async function (err, orders) {
        let success = false
        orders.sort((a, b) => {
            return a.price == b.price ? a.createdDateTime < b.createdDateTime : a.price > b.price
        })
        let askedQuantity = newOrder.quantity
        orders.forEach(async (order) => {
            console.log(order)
            if (order.type === "BUY" && order.orderStatus === "OPEN") {
                if (order.price <= newOrder.price) {
                    const leftQuantity = order.quantity - order.filledQuantity
                    if (leftQuantity >= askedQuantity) {
                        order.filledQuantity += askedQuantity
                        if (order.filledQuantity == order.quantity) {
                            order.orderStatus = "CLOSED"
                        }
                        let newTrade = await new Trade({
                            buyOrderId: order.id,
                            sellOrderId: newOrder.id,
                            price: order.price,
                            quantity: askedQuantity
                        }).save()
                        newOrder.trades.push(newTrade.id)
                        order.trades.push(newTrade.id)
                        success = true
                    } else {
                        askedQuantity -= leftQuantity
                        order.filledQuantity = order.quantity
                        order.orderStatus = "CLOSED"
                        let newTrade = await new Trade({
                            buyOrderId: order.id,
                            sellOrderId: newOrder.id,
                            price: order.price,
                            quantity: leftQuantity
                        }).save()
                        newOrder.trades.push(newTrade.id)
                        order.trades.push(newTrade.id)
                    }
                }
            }
        })
        if (success) {
            await orders.save()
            await newOrder.save()
        }
        return success
    })
}

async function refreshOrderbook() {
    var buyOrders = []
    var sellOrders = []
    Order.find({orderStatus: "OPEN"}).lean().exec(async function (err, orders) {
        orders.forEach((order) => {
            if (order.type == "BUY") {
                let done = false
                buyOrders.forEach((buyOrder) => {
                    if (!done && buyOrder.price == order.price) {
                        buyOrder.quantity += order.quantity
                        done = true
                    }
                })
                if (!done) {
                    buyOrders.push({
                        price: order.price,
                        quantity: order.quantity
                    })
                }
                buyOrders.sort((a, b) => {
                    return a.price > b.price ? 1 : -1
                })
            } else if (order.type == "SELL") {
                let done = false
                sellOrders.forEach((sellOrder) => {
                    if (!done && sellOrder.price == order.price) {
                        sellOrder.quantity += order.quantity
                        done = true
                    }
                })
                if (!done) {
                    sellOrders.push({
                        price: order.price,
                        quantity: order.quantity
                    })
                }
                sellOrders.sort((a, b) => {
                    return a.price > b.price ? 1 : -1
                }).reverse()
            }
        })
        await Orderbook.deleteMany({})
        await new Orderbook({
            buyOrders: buyOrders,
            sellOrders: sellOrders
        }).save()
    })
}

router.post("/", async (req, res) => {
    try {
        const id = req.body.id
        const currencyPair = req.body.currencyPair.toUpperCase()
        const type = req.body.type.toUpperCase()
        const price = req.body.price
        const quantity = req.body.quantity

        if (currencyPair !== "BTCUSD") {
            res.status(400).json({
                message: "Wrong currency pair! Should be BTCUSD."
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

        const newOrder = await new Order({
            id: id,
            currencyPair: currencyPair,
            type: type,
            price: price,
            quantity: quantity
        }).save()

        let removeOrder = false
        if (newOrder.type == "BUY") {
            removeOrder = await checkBuyable(newOrder)
        } else if (newOrder.type == "SELL") {
            removeOrder = await checkSellable(newOrder)
        }

        if (removeOrder) {
            await newOrder.delete()
        }
        await refreshOrderbook()
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