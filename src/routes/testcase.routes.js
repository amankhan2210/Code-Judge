const express = require('express')
const testcaseRouter = express.Router()
const upload = require('../middleware/upload.middleware')
const testcaseController = require('../controllers/testcase.controller')

const submissionController = require('../controllers/submission.controller')
testcaseRouter.post('/submit', submissionController.runCode)
testcaseRouter.get(
'/status/:jobId',
submissionController.getSubmissionStatus
);
testcaseRouter.post('/uploadtestcases/:questionId',  upload.single('file'), testcaseController.uploadTestCases)


module.exports = testcaseRouter