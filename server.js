// environment variables
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config()
}

// imports
const express = require("express")
const server = express()

// database
let dbUrl = process.env.DATABASE_URL
if (dbUrl === undefined){
    process.exit(1)
}

const connectDB = require("./back/database/connect")
connectDB(dbUrl)

// express setup
server.use(express.urlencoded({ extended: false }))
server.use(express.json())

// api endpoints
const orderRoute = require("./back/controller/order")
server.use("/order", orderRoute)

const orderbookRoute = require("./back/controller/orderbook")
server.use("/orderbook", orderbookRoute)

// startup
let port = process.env.PORT
if (port === undefined) {
    port = 3000
}

server.listen(port, () => {
    console.log("Listening on port: " + port)
})