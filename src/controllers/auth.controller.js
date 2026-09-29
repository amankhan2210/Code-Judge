const SendGenOtp = require("../utils/email.util")
const redis = require("../configs/redis")
const bcrypt = require("bcrypt")
const fs = require("fs")
const path = require("path")

const otpRateLimitScript = fs.readFileSync(
    path.join(__dirname, "../scripts/otpRateLimit.lua"),"utf8")

async function getstarted(req, res) {
    try {
        const { email } = req.body
        if (!email || typeof email !== "string") return res.status(400).json({success: false,message: "Valid email is required"})     
        const normalizedEmail = email.trim().toLowerCase()
        const ip = req.ip
        // Redis keys
        const otpKey = `otp:email:${normalizedEmail}`
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
            60,   // Base cooldown: 60 seconds
            5,    // Maximum IP requests
            900   // IP window: 15 minutes
        )
        const [status, value] = result
        if (status === -1) return res.status(429).json({success: false,message: `Please try again in ${value} seconds.`,retryAfter: value})
        if (status === -2) return res.status(429).json({success: false,message: `Too many requests from your IP. Try again in ${value} seconds.`,retryAfter: value})
        const otp = 88858 //await SendGenOtp(normalizedEmail) 
        const hashedOtp = await bcrypt.hash(String(otp), 10)
        await redis.set(otpKey,hashedOtp,"EX",300)
        return res.status(200).json({success: true,message: "OTP sent successfully",otp})
    }
    catch (error) {
        console.error("OTP Error:", error)
        return res.status(500).json({success: false,message: "Something went wrong"})           
    }
}




module.exports = { getstarted };