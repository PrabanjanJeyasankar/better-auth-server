const bcrypt = require('bcryptjs')
const userModel = require('../model/userModel')
const mailService = require('../services/mailService')
const crypto = require('crypto')

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

const requestOtp = async (request, response) => {
    const { email } = request.body

    try {
        const user = await userModel.findOne({ email })
        if (!user) {
            return response.status(404).send({ message: 'User not found' })
        }

        const otp = generateOtp()
        user.otp = otp
        user.otpExpiry = Date.now() + 10 * 60 * 1000 // OTP valid for 10 minutes
        await user.save()

        await mailService.sendOtpEmail(user.email, otp)

        response.status(200).send({ message: 'OTP sent to your email' })
    } catch (error) {
        response.status(500).send({ message: 'Error sending OTP' })
    }
}

const verifyOtp = async (request, response) => {
    const { email, otp } = request.body

    try {
        const user = await userModel.findOne({ email })
        if (!user) {
            return response.status(404).send({ message: 'User not found' })
        }

        if (user.otp !== otp) {
            // If the OTP does not match
            return response.status(400).send({ message: 'Invalid OTP' })
        }

        if (user.otpExpiry < Date.now()) {
            // If the OTP is expired
            return response.status(410).send({ message: 'OTP has expired' })
        }

        // OTP is valid
        user.otp = null
        user.otpExpiry = null
        await user.save()

        response.status(200).send({ message: 'OTP verified' })
    } catch (error) {
        response.status(500).send({ message: 'Error verifying OTP' })
    }
}

const resetPassword = async (request, response) => {
    const { email, newPassword } = request.body

    try {
        const user = await userModel.findOne({ email })
        if (!user) {
            return response.status(404).json({ error: 'User not found' })
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password)
        if (isSamePassword) {
            return response.status(400).json({
                error: 'New password cannot be the same as the old password',
            })
        }

        user.password = newPassword
        await user.save()

        response.status(200).json({ message: 'Password reset successfully' })
    } catch (error) {
        response.status(500).json({ error: 'Error resetting password' })
    }
}

module.exports = {
    requestOtp,
    verifyOtp,
    resetPassword,
}
