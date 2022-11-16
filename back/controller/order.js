// imports
const express = require("express")
const router = express()
const Order = require("../model/order")
const Trade = require("../model/trade")
const Orderbook = require("../model/orderbook")

// endpoints
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
    const orders = Order.find()
    orders.sort((a, b) => {
        return a.price == b.price ? a.createdDateTime < b.createdDateTime : a.price < b.price
    })
    let success = false
    let askedQuantity = newOrder.quantity
    for (let order in orders) {
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
                    break
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
    }
    if (success) {
        await newOrder.save()
    }
    return success
}

async function checkSellable(newOrder) {
    const orders = Order.find()
    orders.sort((a, b) => {
        return a.price == b.price ? a.createdDateTime < b.createdDateTime : a.price > b.price
    })
    let success = false
    let askedQuantity = newOrder.quantity
    for (let order in orders) {
        if (order.type === "BUY" && order.orderStatus === "OPEN") {
            if (order.price >= newOrder.price) {
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
                    await order.save()
                    success = true
                    break
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
                    await order.save()
                }
            }
        }
    }
    if (success) {
        await newOrder.save()
    }
    return success
}

async function refreshOrderbook() {
    let orderbook = new Orderbook()
    const orders = Order.find()
    orders.forEach((order) => {
        if (order.type === "BUY") {
            let done = false
            orderbook.buyOrders.forEach((buyOrder) => {
                if (!done && buyOrder.price == order.price) {
                    buyOrder.quantity += order.quantity
                    done = true
                }
            })
            if (!done) {
                orderbook.buyOrders.push({
                    price: order.price,
                    quantity: order.quantity
                })
            }
            orderbook.buyOrders.sort((a, b) => {
                return a.price > b.price ? 1 : -1
            })
        } else if (order.type === "SELL") {
            let done = false
            orderbook.sellOrders.forEach((sellOrder) => {
                if (!done && sellOrder.price == order.price) {
                    sellOrder.quantity += order.quantity
                    done = true
                }
            })
            if (!done) {
                orderbook.sellOrders.push({
                    price: order.price,
                    quantity: order.quantity
                })
            }
            orderbook.sellOrders.sort((a, b) => {
                return a.price > b.price ? 1 : -1
            }).reverse()
        }
    })

    const orderbooks = Orderbook.find()
    if (orderbooks === []) {
        orderbooks.push(orderbook)
    } else {
        await orderbooks[0].delete()
        orderbooks.push(orderbook)
    }
    await orderbooks.save()
}

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

        const newOrder = await new Order({
            currencyPair: currencyPair,
            type: type,
            price: price,
            quantity: quantity
        }).save()

        let removeOrder = false
        if (newOrder.type === "BUY") {
            removeOrder = await checkBuyable(newOrder)
        } else if (newOrder.type === "SELL") {
            removeOrder = await checkSellable(newOrder)
        }

        if (removeOrder) {
            await newOrder.delete()
        }
        refreshOrderbook()
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