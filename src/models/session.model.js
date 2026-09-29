const mongoose = require("mongoose")

const sessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        refreshTokenHash: {
            type: String,
            required: true
        },

        userAgent: {
            type: String,
            default: null
        },

        ip: {
            type: String,
            default: null
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
)

// Automatically delete expired sessions
sessionSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
)

module.exports = mongoose.model("Session", sessionSchema)