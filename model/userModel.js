const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: false,
        },
        userId: {
            type: String,
            required: function () {
                return this.role !== 'admin'
            },
            unique: true,
        },
        verifiedUser: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            required: true,
            enum: ['user', 'admin'],
            default: 'user',
        },
    },
    {
        collection: 'user',
        timestamps: true,
    }
)

userSchema.pre('save', function (next) {
    const user = this
    if (!user.isModified('password')) {
        return next()
    }

    bcrypt.genSalt(10, (error, salt) => {
        if (error) {
            return next(error)
        }
        bcrypt.hash(user.password, salt, (error, hash) => {
            if (error) {
                return next(error)
            }
            user.password = hash
            next()
        })
    })
})

userSchema.methods.generateJwtToken = function () {
    const id = this._id
    const payload = { id }
    return jwt.sign(payload, process.env.ACCESS_TOKEN, {
        expiresIn: '15d',
    })
}

module.exports = mongoose.model('User', userSchema)
