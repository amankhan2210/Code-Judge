const express = require('express')
const questionRouter = express.Router()
const questionController = require('../controllers/question.controller')

questionRouter.post('/createquestion', questionController.createQuestion)


module.exports = questionRouter