const SendGenOtp = require("../utils/email.util")
const redis = require("../configs/redis")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const fs = require("fs")
const path = require("path")
const Session  = require("../models/session.model")
const User = require("../models/user.model")

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
        const otp = 1234 //await SendGenOtp(normalizedEmail) 
        const hashedOtp = await bcrypt.hash(String(otp), 10)
        await redis.set(otpKey,hashedOtp,"EX",300)
        return res.status(200).json({success: true,message: "OTP sent successfully",otp})
    }
    catch (error) {
        console.error("OTP Error:", error)
        return res.status(500).json({success: false,message: "Something went wrong"})           
    }
}

async function verifyOtp(req, res) {
    const { email, otp } = req.body
    if (!email || typeof email !== "string" || !otp || typeof otp !== "string") {
        return res.status(400).json({success: false,message: "Valid email and OTP are required"})
    }
    const otpKey = `otp:email:${email.trim().toLowerCase()}`
    const storedOtpHash = await redis.get(otpKey)
    if (!storedOtpHash) return res.status(400).json({success: false,message: "OTP expired or not found. Please request a new OTP."})
    const isOtpValid = await bcrypt.compare(otp, storedOtpHash)
    if (!isOtpValid) return res.status(400).json({success: false,message: "Invalid OTP. Please try again."})
    await redis.del(otpKey)
    //new user
    const user = await User.findOne({ email: email.trim().toLowerCase() })
    if(!user) {
        // Handle new user registration logic here
        const regToken = jwt.sign({ email: email.trim().toLowerCase(),purpose: "complete_registration" }, process.env.JWT_SECRET, { expiresIn: '15m' })
        return res.status(200).json({success: true,message: "OTP verified successfully",regToken})
    }
    // user exits create Session
    const refreshToken = jwt.sign({
        id : user._id,
        email : user.email,
    },process.env.JWT_SECRET,{
        expiresIn : '7d'
    })
    const refreshTokenHash = crypto.createHash("md5").update(refreshToken).digest("hex")
    const session = await Session.create({
    user : user._id,
    refreshTokenHash,
    ip : req.ip,
    usergent : req.headers['user-agent']
    })
    const accessToken = jwt.sign({
    id : user._id,
    email : user.email,
    sessionid : session._id,
    },process.env.JWT_SECRET,{expiresIn : '15m'})

    res.cookie("refreshToken",refreshToken,{
    httpOnly : true,
    secure : true,
    sameSite : "strict",    
    maxAge : 7 * 24 * 60 * 60 * 1000
    })

    return res.status(200).json({success: true,message: "OTP verified successfully",accessToken,refreshToken})

}

async function completeRegistration(req, res) {
    const {username, name, phone, college, graduationYear } = req.body
    const email = req.email
    if(await User.findOne({email, username})) return res.status(400).json({success: false,message: "Username  && email already exists"})
    const user = await User.create({
        email,
        username,
        name,
        phone,
        college,
        graduationYear,
        isVerified: true,
        
    })
    const refreshToken = jwt.sign({
        id : user._id,
        email : user.email,
    },process.env.JWT_SECRET,{
        expiresIn : '7d'
    })
    const refreshTokenHash = crypto.createHash("md5").update(refreshToken).digest("hex")
    const session = await Session.create({
    user : user._id,
    refreshTokenHash,
    ip : req.ip,
    usergent : req.headers['user-agent']
    })
    const accessToken = jwt.sign({
    id : user._id,
    email : user.email,
    sessionid : session._id,
    },process.env.JWT_SECRET,{expiresIn : '15m'})

    res.cookie("refreshToken",refreshToken,{
    httpOnly : true,
    secure : true,
    sameSite : "strict",    
    maxAge : 7 * 24 * 60 * 60 * 1000
    })
    return res.status(201).json({success: true,message: "User registered successfully",user,accessToken,refreshToken})    
}


module.exports = { 
    getstarted,
    verifyOtp,
    completeRegistration
};