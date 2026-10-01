const { Worker } = require("bullmq")
const redis = require("../configs/redis")
const SendOtpEmail = require("../utils/email.util")

const worker = new Worker(
    "emailQueue",
    async (job) => {
        const { email, otp } = job.data
        console.log(`Processing OTP email for ${email}`)
        await SendOtpEmail(email, otp)
        console.log(`OTP email sent to ${email}`)
    },
    {
        connection: redis,
        concurrency: 10,
    }
)
worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`)
})
worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message)
})
worker.on("error", (err) => {
    console.error("Worker error:", err)
})
console.log("Email worker started")

module.exports = worker