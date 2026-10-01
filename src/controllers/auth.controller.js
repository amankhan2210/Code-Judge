// const SendGenOtp = require("../utils/email.util")
const redis = require("../configs/redis")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const Session  = require("../models/session.model")
const User = require("../models/user.model")
const emailQueue = require("../queues/emailQueue")

async function getstarted(req, res) {
    try {
        const { email } = req.body
        if (!email || typeof email !== "string") return res.status(400).json({success: false,message: "Valid email is required"})     
        const normalizedEmail = email.trim().toLowerCase()
        const otp = crypto.randomInt(100000, 1000000).toString() 
        const hashedOtp = await bcrypt.hash(String(otp), 10)
        const otpKey = `otp:email:${normalizedEmail}`
        await redis.set(otpKey,hashedOtp,"EX",300)
        await emailQueue.add("sendOtp", {email: normalizedEmail,otp,})
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
    await Session.updateMany({user : user.id, revoked:false},{revoked:true})
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
    userAgent : req.headers['user-agent']
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
    userAgent : req.headers['user-agent']
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

async function rotatetoken(req,res) {
    const refreshToken = req.cookies.refreshToken
    // const { refreshToken } = req.body
    if(!refreshToken) return res.status(401).json({msg : " Token  not found"})
    try {
        const rhash = crypto.createHash("md5").update(refreshToken).digest("hex")
        const session = await Session.findOne({refreshTokenHash:rhash,revoked:false})
        if(!session) return res.status(401).json({msg:"session not found"})
        const decoded = jwt.verify(refreshToken,process.env.JWT_SECRET)
        const user = await User.findById(decoded.id)
        const accessToken = jwt.sign({
            id : user._id,
            sessionid : session._id,
            email : user.email,
        },process.env.JWT_SECRET,{
          expiresIn : '15m'
        })
        const newrefreshToken = jwt.sign({
            id : user._id,
            email : user.email,
        },process.env.JWT_SECRET,{
        expiresIn : '7d'
        })
        const nrhash = crypto.createHash("md5").update(newrefreshToken).digest("hex")
        session.refreshTokenHash =nrhash
        await session.save()
        res.cookie("refreshToken",newrefreshToken,{
        httpOnly : true,
        secure : true,
        sameSite : "strict",
        maxAge : 7 * 24 * 60 * 60 * 1000
        })
        return res.status(200).json({accessToken,newrefreshToken})   
    } catch (error) {
        return res.status(401).json({msg : "wrong access token"})
    }
}

async function logout(req,res) {
    // const { refreshToken } = req.body
    const refreshToken = req.cookies.refreshToken
    if(!refreshToken) return res.status(401).json({msg : "Invalid token or not found"})
    const rhash = crypto.createHash("md5").update(refreshToken).digest("hex")
    const session = await Session.findOne({refreshTokenHash:rhash,revoked:false})
    if(!session) return res.status(401).json({msg : "Invalid token Session not found"})
    session.revoked = true
    await session.save()
    res.clearCookie('refreshToken')
    return res.status(200).json({msg : "Logout-Successfully"})
}



module.exports = { 
    getstarted,
    verifyOtp,
    completeRegistration,
    rotatetoken,
    logout,
    
};