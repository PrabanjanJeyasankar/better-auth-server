const {
    generateAuthUrl,
    getUserDataFromCode,
    verifyAccessToken,
    refreshIdToken,
} = require('../services/authService')

const googleAuthPageRequest = async (request, response) => {
    response.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN_URL)
    response.header('Referrer-Policy', 'no-referer-when-downgrade')

    try {
        const url = generateAuthUrl()
        response.status(200).send({ message: 'Redirected successfully ', url })
    } catch (error) {
        console.error(error)
        response.status(500).send('Error generating auth URL')
    }
}

const handleAuthCallback = async (request, response) => {
    const code = request.query.code

    try {
        const userData = await getUserDataFromCode(code, response)

        console.log('userData : ', userData)
        response.redirect('http://localhost:5173')
    } catch (error) {
        console.error(error)
        response.status(500).send('Error during authentication')
    }
}

const verifyToken = async (request, response) => {
    console.log(request.headers)

    const cookieString = request.headers['cookie']
    console.log(cookieString)
    const parseCookies = (cookieString) => {
        if (!cookieString) {
            console.log('No cookie string found')
            return {}
        }

        const cookies = cookieString.split('; ').reduce((acc, cookie) => {
            const [key, value] = cookie.split('=')
            acc[key] = decodeURIComponent(value)
            return acc
        }, {})

        console.log(cookies)
        return {
            accessToken: cookies.access_token || null,
            refreshToken: cookies.refresh_token || null,
            idToken: cookies.id_token || null,
        }
    }

    const { accessToken, refreshToken, idToken } = parseCookies(cookieString)
    console.log('accessToken:', accessToken)


    if (!accessToken) {
        return response.status(401).send('No access token provided')
    }

    try {
        const userData = await verifyAccessToken(idToken)
        response.json({ userData })
    } catch (error) {
        console.error('Access token verification error:', error)

        if (refreshToken) {
            try {
                const newIdToken = await refreshIdToken(refreshToken)
                const newUserData = await verifyAccessToken(newIdToken)
                response.json({ userData: newUserData })
            } catch (refreshError) {
                console.error('Refresh token error:', refreshError)
                return response
                    .status(401)
                    .send('Invalid access token and refresh token')
            }
        } else {
            return response
                .status(401)
                .send('Invalid access token and no refresh token provided')
        }
    }
}

module.exports = {
    googleAuthPageRequest,
    handleAuthCallback,
    verifyToken,
}
