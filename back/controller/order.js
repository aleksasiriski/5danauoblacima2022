// imports
const express = require("express")
const router = express()
const Order = require("../model/order")
const Trade = require("../model/trade")
const Orderbook = require("../model/orderbook")

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
        const requestedOrder = await Order.findOne({"id": `${req.params.id}`}).lean()
        delete requestedOrder["_id"]
        requestedOrder["price"] = Number(requestedOrder["price"].toFixed(2))
        requestedOrder["quantity"] = Number(requestedOrder["quantity"].toFixed(2))
        requestedOrder["filledQuantity"] = Number(requestedOrder["filledQuantity"].toFixed(2))
        for (let key in requestedOrder["trades"]) {
            let trade = requestedOrder["trades"][key]
            trade = await Trade.findById(trade).lean()
            delete trade["_id"]
            trade["price"] = Number(trade["price"].toFixed(2))
            trade["price"] = Number(trade["price"].toFixed(2))
            trade["quantity"] = Number(trade["quantity"].toFixed(2))
            requestedOrder["trades"][key] = trade
        }
        res.status(200).json(requestedOrder)
    } catch (err) {
        res.status(404).json({
            message: err.message
        })
    }
})

async function checkExchange(newOrder) {
    if (newOrder.type == "BUY") {

        const orders = await Order.find({orderStatus: "OPEN", type: "SELL"})
        orders.sort((a, b) => {
            return (a.price == b.price) ? (a.createdDateTime > b.createdDateTime ? 1 : -1) : (a.price > b.price ? 1 : -1)
        })

        let askedQuantity = newOrder.quantity
        for (let key in orders) {

            let order = orders[key]
            if (order.price <= newOrder.price) {

                let leftQuantity = order.quantity - order.filledQuantity

                if (leftQuantity >= askedQuantity) {
                    order.filledQuantity += askedQuantity

                    if (order.filledQuantity == order.quantity) {
                        order.orderStatus = "CLOSED"
                    }

                    newOrder.filledQuantity = newOrder.quantity
                    newOrder.orderStatus = "CLOSED"

                    let newTrade = await new Trade({
                        buyOrderId: newOrder.id,
                        sellOrderId: order.id,
                        price: order.price,
                        quantity: askedQuantity
                    }).save()

                    order.trades.push(newTrade.id)
                    newOrder.trades.push(newTrade.id)
                    
                    await Order.findByIdAndUpdate(order._id, order)
                    await Order.findByIdAndUpdate(newOrder._id, newOrder)

                    return true
                        
                } else {

                    askedQuantity -= leftQuantity
                    newOrder.filledQuantity += leftQuantity

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

                    await Order.findByIdAndUpdate(order._id, order)
                    await Order.findByIdAndUpdate(newOrder._id, newOrder)

                }
            } else {
                return false
            }
        }

    } else if (newOrder.type == "SELL") {

        const orders = await Order.find({orderStatus: "OPEN", type: "BUY"})
        orders.sort((a, b) => {
            return (a.price == b.price) ? (a.createdDateTime > b.createdDateTime ? 1 : -1) : (a.price < b.price ? 1 : -1)
        })

        let askedQuantity = newOrder.quantity
        for (let key in orders) {

            let order = orders[key]
            if (order.price >= newOrder.price) {

                let leftQuantity = order.quantity - order.filledQuantity

                if (leftQuantity >= askedQuantity) {
                    order.filledQuantity += askedQuantity

                    if (order.filledQuantity == order.quantity) {
                        order.orderStatus = "CLOSED"
                    }
        
                    newOrder.filledQuantity = newOrder.quantity
                    newOrder.orderStatus = "CLOSED"

                    let newTrade = await new Trade({
                        buyOrderId: order.id,
                        sellOrderId: newOrder.id,
                        price: order.price,
                        quantity: askedQuantity
                    }).save()

                    order.trades.push(newTrade.id)
                    newOrder.trades.push(newTrade.id)
                    
                    await Order.findByIdAndUpdate(order._id, order)
                    await Order.findByIdAndUpdate(newOrder._id, newOrder)

                    return true
                        
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

                    await Order.findByIdAndUpdate(order._id, order)
                    await Order.findByIdAndUpdate(newOrder._id, newOrder)

                }
            } else {
                return false
            }
        }
    }
}

async function refreshOrderbook() {
    var buyOrders = []
    var sellOrders = []
    const orders = await Order.find({orderStatus: "OPEN"})

    for (let key in orders) {
        
        let order = orders[key]

        let leftQuantity = order.quantity - order.filledQuantity
        if (order.type == "BUY") {

            let done = false
            for (let key in buyOrders) {
                let buyOrder = buyOrders[key]

                if (buyOrder.price == order.price) {
                    buyOrder.quantity += leftQuantity
                    done = true
                    break
                }
                
            }

            if (!done) {
                buyOrders.push({
                    _id: undefined,
                    price: order.price,
                    quantity: leftQuantity
                })
            }

        } else if (order.type == "SELL") {

            let done = false
            for (let key in sellOrders) {
                let sellOrder = sellOrders[key]

                if (sellOrder.price == order.price) {
                    sellOrder.quantity += leftQuantity
                    done = true
                    break
                }
                
            }

            if (!done) {
                sellOrders.push({
                    _id: undefined,
                    price: order.price,
                    quantity: leftQuantity
                })
            }

        }
    }

    buyOrders.sort((a, b) => {
        return a.price < b.price ? 1 : -1
    })
    sellOrders.sort((a, b) => {
        return a.price > b.price ? 1 : -1
    })

    await Orderbook.deleteMany({})
    await new Orderbook({
        buyOrders: buyOrders,
        sellOrders: sellOrders
    }).save()
    
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

        await checkExchange(newOrder)
        await refreshOrderbook()

        const updatedOrder = await Order.findOne({id: newOrder.id}).lean()
        delete updatedOrder["_id"]
        updatedOrder["price"] = Number(updatedOrder["price"].toFixed(2))
        updatedOrder["quantity"] = Number(updatedOrder["quantity"].toFixed(2))
        updatedOrder["filledQuantity"] = Number(updatedOrder["filledQuantity"].toFixed(2))
        for (let key in updatedOrder["trades"]) {
            let trade = updatedOrder["trades"][key]
            trade = await Trade.findById(trade).lean()
            delete trade["_id"]
            trade["price"] = Number(trade["price"].toFixed(2))
            trade["price"] = Number(trade["price"].toFixed(2))
            trade["quantity"] = Number(trade["quantity"].toFixed(2))
            updatedOrder["trades"][key] = trade
        }
        res.status(201).json(updatedOrder)
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
        await Orderbook.deleteMany({})
        res.status(200)
    } catch(err) {
        res.status(403).json({
            message: err.message
        })
    }
})

// export
module.exports = router