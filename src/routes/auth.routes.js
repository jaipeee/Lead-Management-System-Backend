const express = require('express')
const router = express.Router()
const {registerUser, loginUser} = require('../controllers/auth.controller.js')
const { checkDuplicateUser } = require('../middleware/auth.middleware.js')

router.post("/register", checkDuplicateUser, registerUser)
router.post('/login', loginUser)

module.exports = router
