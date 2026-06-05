const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const app = express()
const authRoutes = require('./routes/auth.routes')
const leadRoute = require('./routes/lead.routes')
const metaRoutes = require('./routes/meta.routes')
const googleRoutes = require('./routes/google.routes')
const reportsRoutes = require('./routes/reports.routes')

const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes)
app.use('/api/google', googleRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/lead', leadRoute)
app.use('/api/meta', metaRoutes)


module.exports= app
