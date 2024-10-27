const oAuth2Client = require('../config/googleAuthConfig')

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

module.exports = {
    generateAuthUrl,
    getUserDataFromCode,
    verifyAccessToken,
    refreshIdToken,
}
