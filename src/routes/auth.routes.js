const express = require('express')
const authRouter = express.Router()
const authController = require('../controllers/auth.controller')

authRouter.post('/sendemail', authController.getstarted)


module.exports = authRouter