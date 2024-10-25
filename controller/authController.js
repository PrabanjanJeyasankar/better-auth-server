const { init } = require('@paralleldrive/cuid2')
const bcrypt = require('bcryptjs')
const userModel = require('../model/userModel')
const superAdminCredentials = require('../database/initialData')

const cuid = init()

const signup = async (request, response) => {
    const { name, email, password } = request.body

    try {
        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return response.status(409).send({ error: 'User already exists' })
        }

        const userId = cuid()
        console.log('user id : ', userId)

        const newUser = new userModel({ userId, name, email, password })

        await newUser.save()

        const token = newUser.generateJwtToken()
        const options = { httpOnly: true, secure: true, sameSite: 'none' }

        const { password: userPassword, ...userProfile } = newUser.toObject()

        response.cookie('sessionId', token, options)
        return response.status(201).send({
            message: 'User created and successfully added into DB.',
            userProfile,
        })
    } catch (error) {
        console.error('Signup error:', error)
        return response.status(500).send({ error: 'Internal server error' })
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
        console.error('Google Signup error:', error)
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

// const loginGoogleUser = async (request, response) => {
//     const { googleId } = request.body

//     try {
//         const existingUser = await userModel.findOne({ googleId })

//         if (!existingUser) {
//             return response.status(404).send({ error: 'User not found' })
//         }

//         const token = existingUser.generateJwtToken()
//         const options = { httpOnly: true, secure: true, sameSite: 'none' }

//         response.cookie('sessionId', token, options)

//         const { password, ...userProfile } = existingUser.toObject()
//         return response.status(200).send({
//             message: 'User logged in successfully.',
//             userProfile,
//         })
//     } catch (error) {
//         console.error('Google Login error:', error)
//         return response.status(500).send({ error: 'Internal server error' })
//     }
// }

module.exports = {
    signup,
    signupGoogleUser,
    login,
}
