require('dotenv').config()

const PORT = 3003
const mongoUrl = process.env.MONGODB_URI


module.exports = { PORT, mongoUrl }