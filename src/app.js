const express = require('express')
const authRouter = require('../src/routes/auth.routes')
const questionRouter = require('../src/routes/question.routes')
const morgan = require('morgan')
const cookieParser = require("cookie-parser")
const app = express()
require('dotenv').config()
app.use(morgan('dev'))
app.use(express.json());
app.use(cookieParser())
app.use('/api/auth',authRouter)
app.use('/api/question',questionRouter)
module.exports = app    