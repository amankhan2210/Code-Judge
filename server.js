const app = require('./src/app')
const connectDB = require('./src/configs/database')
const redis = require("./src/configs/redis")

connectDB()

app.listen(3000, ()=>{
    console.log('Server is running on port 3000')
})
