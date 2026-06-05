const express = require('express')
const { authLimiter } = require('../middleware/rateLimiters')
const authController = require('../controllers/authController')

const router = express.Router()

router.post('/register', authLimiter, authController.register)
router.post('/login', authLimiter, authController.login)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)

module.exports = router
