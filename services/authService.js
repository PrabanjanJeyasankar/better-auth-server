const oAuth2Client = require('../config/googleAuthConfig')
const moment = require('moment')
const otpModel = require('../model/otpModel')
const mailService = require('../services/mailService')
const OtpError = require('../errors/otpError')

const generateAuthUrl = () => {
    return oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile openid',
        prompt: 'consent',
    })
}

async function fetchUserData(accessToken) {
    const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    )
    const data = await response.json()
    data.accessToken = accessToken
    return data
}

const getUserDataFromCode = async (code, response) => {
    try {
        const { tokens } = await oAuth2Client.getToken(code)
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
        }
        response.cookie('access_token', tokens.access_token, options)
        response.cookie('refresh_token', tokens.refresh_token, options)
        response.cookie('id_token', tokens.id_token, options)

        const accessToken = tokens.access_token
        return await fetchUserData(accessToken)
    } catch (error) {
        throw new Error('Failed to get user data')
    }
}

const verifyAccessToken = async (idToken) => {
    try {
        const ticket = await oAuth2Client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        })
        return ticket.getPayload()
    } catch (error) {
        throw new Error('Invalid access token')
    }
}

const refreshIdToken = async (refreshToken) => {
    try {
        const response = await fetch('https://your-auth-provider.com/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        })

        if (!response.ok) {
            throw new Error('Failed to refresh ID token')
        }

        const data = await response.json()
        return data.id_token
    } catch (error) {
        throw error
    }
}

const generateAndSendOtp = async (email) => {
    try {
        const otp = await generateOtp(email)
        await mailService.sendOtpThroughEmail(email, otp)
    } catch (error) {
        if (error instanceof OtpError) {
            throw new OtpError(error.message)
        }
        throw new Error(error)
    }
}

const generateOtp = async (email) => {
    const otpDocument = await checkForExistingOtpDocument(email)
    const MAX_ATTEMPTS = 3

    if (otpDocument) {
        if (otpDocument.attempts < MAX_ATTEMPTS) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString()
            const expiresAt = moment().add(10, 'minutes').toDate()

            otpDocument.otp = otp
            otpDocument.expiresAt = expiresAt
            otpDocument.attempts += 1

            await otpDocument.save()

            return otp
        } else {
            throw new OtpError('Otp attempt limit exceeded.')
        }
    } else {
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = moment().add(10, 'minutes').toDate()

        const otpData = {
            email,
            otp,
            expiresAt,
            attempts: 1,
        }

        await generateOtpDocument(otpData)

        return otp
    }
}

const generateOtpDocument = async (otpData) => {
    const newOtp = new otpModel(otpData)
    return await newOtp.save()
}

const checkForExistingOtpDocument = async (email) => {
    return await otpModel.findOne({ email })
}

const getOtpDocumentByEmail = async (email) => {
    const otpData = await otpModel.findOne({ email })
    if (!otpData) {
        throw new Error('No Verification code was found.')
    }

    return otpData
}

module.exports = {
    generateAuthUrl,
    getUserDataFromCode,
    verifyAccessToken,
    refreshIdToken,
    generateAndSendOtp,
    generateOtp,
    getOtpDocumentByEmail,
}
