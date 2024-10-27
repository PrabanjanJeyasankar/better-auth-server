const express = require('express')
const router = express.Router()

const {
    googleAuthPageRequest,
    handleAuthCallback,
    verifyToken,
} = require('../controller/googleAuthController')

router.get('/page-request', googleAuthPageRequest)
router.get('/verify-user', handleAuthCallback)
router.get('/verify', verifyToken)

module.exports = router
