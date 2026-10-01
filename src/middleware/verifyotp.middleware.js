const redis = require("../configs/redis")
const fs = require("fs")
const path = require("path")

const WINDOW_SECONDS = 60 * 60 // 1 hour
const MAX_REQUESTS = 3

// Atomic Lua Script
const rateLimitScript = fs.readFileSync(
    path.join(__dirname, "../scripts/verifyOtpRateLimit.lua"),"utf8")


const verifyOtpLimiter = async (req, res, next) => {
    try {
        const { email } = req.body
        const normalizedEmail = email.trim().toLowerCase();
        const ip = req.ip.replace(/^::ffff:/, "")
        const redisKey = `ratelimit:verifyotp:${ip}`
        const emailKey = `ratelimit:verifyotp:email:${normalizedEmail}`
        const result = await redis.eval(
            rateLimitScript,
            2,
            redisKey,
            emailKey,
            MAX_REQUESTS,
            WINDOW_SECONDS
        )
        if (result === 0) {
            return res.status(429).json({
                success: false,
                message: "Too many OTP verification attempts. Please try again after 1 hour."
            })
        }
        next()
    } catch (error) {
        console.error("Rate limiter error:", error)
        return res.status(503).json({
            success: false,
            message: "Service temporarily unavailable. Please try again later."
        })
    }
}
module.exports = verifyOtpLimiter
