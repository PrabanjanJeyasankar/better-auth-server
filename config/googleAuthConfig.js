const { OAuth2Client } = require('google-auth-library')
require('dotenv').config()

const redirectURL = 'http://localhost:3500/api/v1/google-auth/verify-user'

const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectURL
)

module.exports = oAuth2Client
