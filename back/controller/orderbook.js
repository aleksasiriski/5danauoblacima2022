// imports
const express = require("express")
const router = express()
const Orderbook = require("../model/orderbook")

// endpoints
router.get("/", async (req, res) => {
    try {
        const orderbooks = await Orderbook.find().lean()
        let orderbook = orderbooks[0]
        if (orderbook == undefined) {
            orderbook = {
                buyOrders: [],
                sellOrders: []
            }
        } else {
            delete orderbook["_id"]
            delete orderbook["id"]
            delete orderbook["createdDateTime"]
            delete orderbook["updatedDateTime"]
            for (let key in orderbook["buyOrders"]) {
                delete orderbook["buyOrders"][key]["_id"]
            }
            for (let key in orderbook["sellOrders"]) {
                delete orderbook["sellOrders"][key]["_id"]
            }
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