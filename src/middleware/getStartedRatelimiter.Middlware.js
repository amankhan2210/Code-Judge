const redis = require("../configs/redis")
const fs = require("fs")
const path = require("path")
const formatTime = require("../helperFunction/auth.helper")

const otpRateLimitScript = fs.readFileSync(
    path.join(__dirname, "../scripts/otpRateLimit.lua"),"utf8")



async function getStartedRateLimiter(req, res, next) {
    try{
        const { email } = req.body
        if (!email || typeof email !== "string") return res.status(400).json({success: false,message: "Valid email is required"})     
        const normalizedEmail = email.trim().toLowerCase()
        const ip = req.ip
        // Redis keys
        const emailKey = `otp:attempts:${normalizedEmail}`
        const cooldownKey = `otp:cooldown:${normalizedEmail}`
        const stageKey = `otp:stage:${normalizedEmail}`
        const ipKey = `otp:ip:${ip}`
        // Execute Lua atomically
        const result = await redis.eval(
            otpRateLimitScript,
            4,
            emailKey,
            ipKey,
            cooldownKey,
            stageKey,
            3,    // First 3 requests
            60 * 60,   // Base cooldown: 60 seconds
            5,    // Maximum IP requests
            900   // IP window: 15 minutes
        )
        const [status, value] = result
        if (status === -1) return res.status(429).json({success: false,message: `Please try again in ${formatTime(value)}.`,retryAfter: value})
        if (status === -2) return res.status(429).json({success: false,message: `Too many requests from your IP. Try again in ${value} seconds.`,retryAfter: value})
        next()
    }
    catch (error) {
        console.error("Rate limiter error:", error)
        return res.status(503).json({
            success: false,
            message: "Service temporarily unavailable. Please try again later."
        })
    }
}
module.exports = getStartedRateLimiter