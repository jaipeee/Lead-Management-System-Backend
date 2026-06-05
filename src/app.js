const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()
const authRoutes = require('./routes/auth.routes')
const leadRoute = require('./routes/lead.routes')
const metaRoutes = require('./routes/meta.routes')
const googleRoutes = require('./routes/google.routes')
const reportsRoutes = require('./routes/reports.routes')

const allowedOrigins = [
    process.env.CLIENT_UR,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean)

app.use((req, res, next) => {
    const origin = req.headers.origin

    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin)
    }

    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204)
    }

    next()
})

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes)
app.use('/api/google', googleRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/lead', leadRoute)
app.use('/api/meta', metaRoutes)


module.exports= app
