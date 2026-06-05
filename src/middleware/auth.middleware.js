const jwt = require('jsonwebtoken')
const authModel = require('../models/auth.model')

async function checkDuplicateUser(req, res, next) {
    try {
        const { username, email } = req.body
        const isUserAvailable = await authModel.findOne({
            $or: [{ username }, { email }]
        })

        if (isUserAvailable) {
            return res.status(409).json({
                msg: "User already exists"
            })
        }

        next()
    } catch (error) {
        res.status(500).json({
            msg: "Something went wrong while checking user"
        })
    }
}

async function requireAuth(req, res, next) {
    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({
                msg: 'Please login first'
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_TOKEN)
        req.user = decoded
        next()
    } catch (error) {
        res.status(401).json({
            msg: 'Invalid or expired login'
        })
    }
}

module.exports = { checkDuplicateUser, requireAuth }
