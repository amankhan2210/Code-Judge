const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        username: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            minlength: 3,
            maxlength: 20
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        name: {
            type: String,
            trim: true,
            default: null
        },

        phone: {
            type: String,
            trim: true,
            default: null
        },

        college: {
            type: String,
            trim: true,
            default: null
        },

        graduationYear: {
            type: Number,
            default: null
        },

        avatar: {
            type: String,
            default: null
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("User", userSchema);