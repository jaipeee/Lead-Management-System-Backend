require('dotenv').config()
const app = require('./src/app')
const connectDb = require("./src/config/db")
const { startScheduler } = require('./src/scheduler')
const PORT = process.env.PORT || 3000

connectDb()
startScheduler()

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})