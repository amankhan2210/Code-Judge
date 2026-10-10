const User = require("../models/user.model")

async function adminMiddleware(req,res,next) {
    try{
        const user = await User.findById(req.user.id).select('role')
        if(user.role!='admin') return res.status(403).json({msg : 'Admin access Required'})
        next()
    }
    catch(error){
        return res.status(500).json({msg: 'Server Error'})
    }
}
module.exports = adminMiddleware