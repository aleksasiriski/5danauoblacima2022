// imports
const mongoose = require("mongoose")

// connect database
async function connectDB(url) {
    try {
        await mongoose.connect(url, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        })
        console.log("Connected to database!")
    } catch (err) {
        console.log(`Error! ${err.message}`)
    }
}

// export
module.exports = connectDB