const { Queue } = require("bullmq")
const redis = require("../configs/redis")

const emailQueue = new Queue("emailQueue", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,

        backoff: {
            type: "exponential",
            delay: 2000,
        },

        removeOnComplete: true,
        removeOnFail: {
            count: 1000,
        },
    },
});

module.exports = emailQueue