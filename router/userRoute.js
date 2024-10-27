const express = require('express')
const router = express.Router()
const {
    requestSignupOtp,
    verifySignupOtp,
    signupGoogleUser,
    login,
    logout,
} = require('../controller/authController')

const {
    requestOtp,
    verifyOtp,
    resetPassword,
} = require('../controller/passwordResetController')

router.post('/request-signup-otp', requestSignupOtp)
router.post('/verify-signup-otp', verifySignupOtp)
router.post('/google-signup', signupGoogleUser)
router.post('/login', login)
router.post('/logout', logout)

router.post('/request-otp', requestOtp)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)

module.exports = router
