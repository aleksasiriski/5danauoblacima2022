// imports
const express = require("express")
const router = express()
const Orderbook = require("../model/orderbook")

// endpoints
router.get("/", async (req, res) => {
    try {
        const orderbooks = await Orderbook.find()
        res.status(200).json(orderbooks)
    } catch (err) {
        res.status(404).json({
            message: err.message
        })
    }
})

// export
module.exports = router