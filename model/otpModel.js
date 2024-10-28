const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is a mandatory field'],
        },
        otp: {
            type: Number,
            required: [true, 'OTP is a mandatory field'],
        },
        expiresAt: {
            type: Date,
        },
        attempts: {
            type: Number,
            default: 0,
        },
    },
    {
        collection: 'otp',
    },
    {
        timestamps: true,
    }
)

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('otp', otpSchema)
