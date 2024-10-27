const { init } = require('@paralleldrive/cuid2')
const bcrypt = require('bcryptjs')
const userModel = require('../model/userModel')
const mailService = require('../services/mailService')
const superAdminCredentials = require('../database/initialData')
const cuid = init()

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

const requestSignupOtp = async (request, response) => {
    const { email, password, name } = request.body

    try {
        let existingUser = await userModel.findOne({ email })

        if (existingUser) {
            if (existingUser.verifiedUser) {
                return response
                    .status(409)
                    .send({ error: 'User already exists' })
            }
        } else {
            const userId = cuid()
            existingUser = new userModel({
                userId,
                email,
                name,
                password: await bcrypt.hash(password, 10),
                verifiedUser: false, 
            })
        }

        const otp = generateOtp()
        const otpExpiry = Date.now() + 10 * 60 * 1000

        existingUser.otp = otp
        existingUser.otpExpiry = otpExpiry

        await existingUser.save()

        await mailService.sendOtpEmail(email, otp)

        response.status(200).send({ message: 'OTP sent to your email' })
    } catch (error) {
        response.status(500).send({ message: 'Error sending OTP' })
    }
}

const verifySignupOtp = async (request, response) => {
    const { email, otp: inputOtp } = request.body

    try {
        const existingUser = await userModel.findOne({ email })
        if (!existingUser) {
            return response.status(404).send({ message: 'User not found' })
        }
        if (existingUser.otp !== inputOtp) {
            return response.status(400).send({ message: 'Invalid OTP' })
        }
        if (existingUser.otpExpiry < Date.now()) {
            return response.status(410).send({ message: 'OTP has expired' })
        }

        existingUser.verifiedUser = true
        existingUser.otp = null
        existingUser.otpExpiry = null
        await existingUser.save()

        const token = existingUser.generateJwtToken()
        const options = { httpOnly: true, secure: true, sameSite: 'none' }
        const { password, ...userProfile } = existingUser.toObject()

        response.cookie('sessionId', token, options)
        response.status(201).send({
            message: 'User verified and created successfully.',
            userProfile,
        })
    } catch (error) {
        response
            .status(500)
            .send({ message: 'Error verifying OTP and creating user' })
    }
}

const signupGoogleUser = async (request, response) => {
    const { name, email, googleId } = request.body

    try {
        let existingUser =
            (await userModel.findOne({ googleId })) ||
            (await userModel.findOne({ email }))
        if (existingUser) {
            return response.status(409).send({ error: 'User already exists' })
        }

        const userId = cuid()
        const newUser = new userModel({
            userId,
            name,
            email,
            googleId,
            password: null,
        })

        await newUser.save()

        const token = newUser.generateJwtToken()
        const options = { httpOnly: true, secure: true, sameSite: 'none' }

        const { password, ...userProfile } = newUser.toObject()
        response.cookie('sessionId', token, options)

        return response.status(201).send({
            message: 'Google user created successfully.',
            userProfile,
        })
    } catch (error) {
        return response.status(500).send({ error: 'Internal server error' })
    }
}

const login = async (request, response) => {
    const { email, password } = request.body
    try {
        const allUser = await userModel.find()
        if (allUser.length == 0) {
            const adminUser = new userModel(superAdminCredentials)
            await adminUser.save()
        }
        const existingUser = await userModel.findOne({ email })
        if (!existingUser) {
            return response
                .status(404)
                .send({ message: 'User not found, Kindly sign up' })
        }
        const validPassword = await bcrypt.compare(
            password,
            existingUser.password
        )

        if (!validPassword) {
            return response.status(401).send({ message: 'Incorrect Password' })
        }

        const token = existingUser.generateJwtToken()
        const options = { httpOnly: 'true', secure: 'true', sameSite: 'none' }
        const { password: userPassword, ...userProfile } = existingUser._doc

        response.cookie('sessionId', token, options)
        response
            .status(200)
            .send({ message: 'Logged in successfully', userProfile })
    } catch (error) {
        response.status(500).send({ message: error.message })
    }
}

const logout = async (request, response) => {
    response.clearCookie('access_token')
    response.clearCookie('id_token')
    response.clearCookie('refresh_token')
    response.status(200).send({ message: 'Logged out successfully' })
}

module.exports = {
    requestSignupOtp,
    verifySignupOtp,
    signupGoogleUser,
    login,
    logout,
}
