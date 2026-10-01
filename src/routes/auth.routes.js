const express = require('express')
const authRouter = express.Router()
const authController = require('../controllers/auth.controller')
const verifyRegistrationToken = require('../middleware/registration.middleware')
const authMiddleware = require('../middleware/auth.middleware')
const verifyOtpLimiter = require('../middleware/verifyotp.middleware')

authRouter.post('/sendemail', authController.getstarted)
authRouter.post('/verifyotp', verifyOtpLimiter,authController.verifyOtp)
authRouter.post('/complete-registration', verifyRegistrationToken, authController.completeRegistration)
authRouter.post('/rotatetoken', authMiddleware,authController.rotatetoken)
authRouter.get('/logout', authMiddleware,authController.logout)


module.exports = authRouter