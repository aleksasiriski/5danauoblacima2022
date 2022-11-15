// imports
const express = require("express")
const router = express()
const Orderbook = require("../model/orderbook")

// endpoints
router.get("/", async (req, res) => {
    try {
        const currentOrderbook = await Orderbook.find()
        res.status(200).json(currentOrderbook)
        // currentOrderbook[0] ?
    } catch (err) {
        res.status(404).json({
            message: err.message
        })
    }
})

// export
module.exports = router