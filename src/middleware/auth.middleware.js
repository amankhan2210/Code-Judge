const jwt = require('jsonwebtoken')
const Session =require('../models/session.model')

async function authMiddleware(req,res,next) {
    const token = req.headers.authorization?.split(" ")[1]
    if(!token) return res.status(409).json({msg : 'Acess-token need'})
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        const session = await Session.findOne({_id : decoded.sessionid,user: decoded.id,revoked:false})
        if(!session) return res.status(409).json({msg:'Session expired or revoked'})
        req.user = {
            id: decoded.id,
            email : decoded.email,
            sessionid: decoded.sessionid
        }
        next()
    }
    catch(error){
        return res.status(401).json({msg : 'Invalid or expired access token'})
    }
}

module.exports = authMiddleware