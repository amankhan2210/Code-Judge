const express = require('express')
const authRouter = express.Router()
const authController = require('../controllers/auth.controller')
const verifyRegistrationToken = require('../middleware/registration.middleware')

authRouter.post('/sendemail', authController.getstarted)
authRouter.post('/verifyotp', authController.verifyOtp)
authRouter.post('/complete-registration', verifyRegistrationToken, authController.completeRegistration)

module.exports = authRouter