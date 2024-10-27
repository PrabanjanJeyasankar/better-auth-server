require('dotenv').config();

const express = require('express')
const app = express()
const PORT = 3500
const cookieParser = require('cookie-parser')

const userRoute = require('./router/userRoute')
const googleAuthRoute = require('./router/googleAuthRoute')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.DB_URI)

const db = mongoose.connection

db.on('error', (error) => {
    console.log(error)
})

db.once('open', () => {
    console.log('db connected successfully.')
})

app.get('/', (request, response) => {
    response.status(200).send({ message: 'server running successfully' })
})

app.use(
    cors({
        origin: process.env.CORS_ORIGIN_URL,
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/v1/google-auth', googleAuthRoute)

app.use('/api/v1/user', userRoute)

app.listen(PORT, console.log(`server running at http://localhost:${PORT}`))
