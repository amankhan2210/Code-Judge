const jwt = require("jsonwebtoken")


async function verifyRegistrationToken(req, res, next){
try{
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) return res.status(401).json({ success: false, message: "Authorization token is required" })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded || decoded.purpose !== "complete_registration") {
        return res.status(401).json({ success: false, message: "Invalid or expired token" })
    }
    req.email = decoded.email
    next()
}
catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" })
}

}
module.exports = verifyRegistrationToken;