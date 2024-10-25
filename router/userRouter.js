const express = require('express')
const router = express.Router()
const {
    signup,
    signupGoogleUser,
    login,
} = require('../controller/authController')

const {
    requestOtp,
    verifyOtp,
    resetPassword,
} = require('../controller/passwordResetController')

router.post('/signup', signup)
router.post('/google-signup', signupGoogleUser)
router.post('/login', login)
// router.post('/google-login', loginGoogleUser)
// router.get('/logout', logout)

router.post('/request-otp', requestOtp)
router.post('/verify-otp', verifyOtp)
router.post('/update-password', resetPassword)

module.exports = router
