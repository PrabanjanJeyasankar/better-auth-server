const bcrypt = require('bcryptjs')
const userModel = require('../model/userModel')
const mailService = require('../services/mailService')
const { getUserByEmail } = require('../services/userService')
const {
    generateAndSendOtp,
    getOtpDocumentByEmail,
} = require('../services/authService')
const { setResponseBody } = require('../utils/responseFormatter')

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

const requestOtp = async (request, response) => {
    const { email } = request.body
    try {
        const user = await getUserByEmail(email)

        if (!user) {
            return response
                .status(404)
                .send(setResponseBody('User not found', 'user_not_found', null))
        }

        await generateAndSendOtp(user.email)

        return response
            .status(200)
            .send(setResponseBody('OTP sent to your email', null, null))
    } catch (error) {
        response
            .status(500)
            .send(
                setResponseBody(
                    'Error sending OTP',
                    'otp_sending_error',
                    error.message
                )
            )
    }
}

const verifyOtp = async (request, response) => {
    const { email, otp: inputOtp } = request.body

    try {
        const otpData = await getOtpDocumentByEmail(email)

        if (!otpData) {
            return response
                .status(404)
                .send(
                    setResponseBody(
                        'OTP expired, please resend',
                        'otp_expired',
                        null
                    )
                )
        }

        if (otpData.otp.toString() !== inputOtp.toString()) {
            return response
                .status(400)
                .send(setResponseBody('Invalid OTP', 'invalid_otp', null))
        }

        return response
            .status(200)
            .send(setResponseBody('OTP verified successfully', null, null))
    } catch (error) {
        return response
            .status(500)
            .send(
                setResponseBody(
                    'Error verifying OTP',
                    'server_error',
                    error.message
                )
            )
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
