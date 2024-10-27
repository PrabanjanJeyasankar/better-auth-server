const jwt = require('jsonwebtoken')
const userModel = require('../model/userModel')

const verifyUser = (request, response, next) => {
    const authHeader = request.headers.cookie
    if (!authHeader) {
        return response.status(401).send({ message: 'Token not found' })
    }
    const cookie = authHeader.split('=')[1]

    jwt.verify(cookie, process.env.ACCESS_TOKEN, async (error, data) => {
        if (error) {
            return response.status(401).send({ message: 'session expired' })
        }
        const { id } = data

        const existingUser = await userModel.findOne({ _id: id })
        if (!existingUser) {
            return response.status(401).send({ message: 'Unauthorized user' })
        }
        request.user = existingUser
        next()
    })
}

module.exports = { verifyUser }
