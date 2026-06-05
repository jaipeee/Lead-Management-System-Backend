const authModel = require('../models/auth.model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')


async function registerUser(req, res) {
    try {
        const { username, email, password} = req.body

        const hash = await bcrypt.hash(password, 10)

        const user = await authModel.create({
            username, email, password: hash
        })

        const token = await jwt.sign({
            id: user._id,
        }, process.env.JWT_TOKEN)

        res.cookie("token", token,{
            httpOnly: true,
            secure :true,
            sameSite : 'none'
        })
        res.status(201).json({
            msg: "User registered successfully",
            user: {
                username: user.username,
                email: user.email,
            }
        })
    } catch (error) {
        res.status(500).json({
            msg: "Something went wrong while registering user"
        })
    }
}




async function loginUser(req, res) {
    try {
        const { email, password } = req.body
        const user = await authModel.findOne({ email })

        if (!user) {
            return res.status(404).json({
                msg: "User not found"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({
                msg: "Incorrect password"
            })
        }

        const token = await jwt.sign({
            id: user._id
        }, process.env.JWT_TOKEN)

        res.cookie("token", token)
        res.status(200).json({
            msg: "Login successful",
            token,
            user: {
                username: user.username,
                email: user.email
            }
        })
    } catch (error) {
        res.status(500).json({
            msg: "Something went wrong while logging in"
        })
    }

}


module.exports = {registerUser, loginUser }
