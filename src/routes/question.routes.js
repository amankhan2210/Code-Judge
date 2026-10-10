const express = require('express')
const questionRouter = express.Router()
const questionController = require('../controllers/question.controller')
const adminMiddleware = require('../middleware/admin.middleware')
const authMiddleware = require('../middleware/auth.middleware')

questionRouter.post('/createquestion',authMiddleware,adminMiddleware,questionController.createQuestion)


module.exports = questionRouter