const mongoose = require("mongoose");
const { Worker } = require("bullmq");
const { connection } = require("../queues/submission.queue");
const { executeSubmission } = require("../services/submission.service");

const concurrency = Math.max(
  1,
  Number(process.env.SUBMISSION_CONCURRENCY || 2)
);

let worker;

async function startWorker() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    // Connect MongoDB before processing jobs
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("[WORKER] MongoDB connected");

    worker = new Worker(
      "code-submissions",
      async (job) => {
        console.log("[WORKER] Processing:", job.id);

        await job.updateProgress(10);

        const result = await executeSubmission(job.data);

        await job.updateProgress(100);

        console.log(
          "[WORKER] Completed:",
          job.id,
          result.verdict
        );

        return result;
      },
      {
        connection,
        concurrency,
      }
    );

    worker.on("completed", (job) => {
      console.log("[WORKER] Job completed:", job.id);
    });

    worker.on("failed", (job, error) => {
      console.error(
        "[WORKER] Job failed:",
        job?.id,
        error.message
      );
    });

    worker.on("error", (error) => {
      console.error("[WORKER] Error:", error);
    });

    console.log(
      `[WORKER] Started with concurrency=${concurrency}`
    );
  } catch (error) {
    console.error("[WORKER] Startup failed:", error.message);
    process.exit(1);
  }
}

async function shutdown() {
  console.log("[WORKER] Shutting down...");

  try {
    if (worker) {
      await worker.close();
    }

    await mongoose.disconnect();
    await connection.quit();

    process.exit(0);
  } catch (error) {
    console.error("[WORKER] Shutdown error:", error.message);
    process.exit(1);
  }
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);

startWorker();