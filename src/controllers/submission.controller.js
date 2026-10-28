
// const mongoose = require("mongoose");
// const { submissionQueue } = require("../queues/submission.queue");

// const SUPPORTED_LANGUAGES = ["cpp", "javascript", "python", "java"];

// // Run Code API
// exports.runCode = async (req, res) => {
//   try {
//     const { questionId, language, sourceCode } = req.body || {};

//     if (!questionId || !mongoose.isValidObjectId(questionId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid questionId is required",
//       });
//     }

//     if (
//       typeof language !== "string" ||
//       !SUPPORTED_LANGUAGES.includes(language.toLowerCase())
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Unsupported programming language",
//       });
//     }

//     if (
//       typeof sourceCode !== "string" ||
//       !sourceCode.trim()
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Source code is required",
//       });
//     }

//     const jobId = new mongoose.Types.ObjectId().toString();

//     await submissionQueue.add(
//       "execute-code",
//       {
//         questionId: questionId.toString(),
//         language: language.toLowerCase(),
//         sourceCode,
//       },
//       {
//         jobId,
//         removeOnComplete: false,
//         removeOnFail: false,
//       }
//     );

//     return res.status(202).json({
//       success: true,
//       message: "Code submitted successfully",
//       jobId,
//       status: "Queued",
//     });
//   } catch (error) {
//     console.error("[CONTROLLER] runCode error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to submit code",
//     });
//   }
// };

// // Get Submission Status API
// exports.getSubmissionStatus = async (req, res) => {
//   try {
//     const { jobId } = req.params;

//     if (!mongoose.isValidObjectId(jobId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid jobId",
//       });
//     }

//     const job = await submissionQueue.getJob(jobId);

//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         message: "Submission not found",
//       });
//     }

//     const state = await job.getState();

//     if (state === "completed") {
//       return res.status(200).json({
//         success: true,
//         jobId,
//         status: "Completed",
//         result: job.returnvalue,
//       });
//     }

//     if (state === "failed") {
//       return res.status(200).json({
//         success: true,
//         jobId,
//         status: "Failed",
//         message: job.failedReason || "Code execution failed",
//       });
//     }

//     const statusMap = {
//       waiting: "Queued",
//       active: "Processing",
//       delayed: "Delayed",
//       waitingForChildren: "Queued",
//       prioritized: "Queued",
//     };

//     return res.status(200).json({
//       success: true,
//       jobId,
//       status: statusMap[state] || state,
//     });
//   } catch (error) {
//     console.error("[CONTROLLER] getSubmissionStatus error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch submission status",
//     });
//   }
// };

const mongoose = require("mongoose");
const { submissionQueue } = require("../queues/submission.queue");

const SUPPORTED_LANGUAGES = ["cpp", "javascript", "python", "java"];

// Run Code API
exports.runCode = async (req, res) => {
  try {
    const { questionId, language, sourceCode } = req.body || {};

    if (!questionId || !mongoose.isValidObjectId(questionId)) {
      return res.status(400).json({
        success: false,
        message: "Valid questionId is required",
      });
    }

    if (
      typeof language !== "string" ||
      !SUPPORTED_LANGUAGES.includes(language.trim().toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Unsupported programming language",
      });
    }

    if (
      typeof sourceCode !== "string" ||
      !sourceCode.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Source code is required",
      });
    }

    const normalizedLanguage = language.trim().toLowerCase();
    const jobId = new mongoose.Types.ObjectId().toString();

    await submissionQueue.add(
      "execute-code",
      {
        questionId: questionId.toString(),
        language: normalizedLanguage,
        sourceCode,
      },
      {
        jobId,
        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    return res.status(202).json({
      success: true,
      message: "Code submitted successfully",
      jobId,
      status: "Queued",
    });
  } catch (error) {
    console.error("[CONTROLLER] runCode error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit code",
    });
  }
};

// Get Submission Status API
exports.getSubmissionStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid jobId",
      });
    }

    const job = await submissionQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    const state = await job.getState();

    // The worker completed execution.
    // Accepted, Wrong Answer, TLE and Compilation Error
    // are all valid execution results.
    if (state === "completed") {
      const result = job.returnvalue || {};

      return res.status(200).json({
        success: true,
        jobId,
        status: "Completed",
        result: {
          success: result.success ?? false,
          verdict: result.verdict || "Execution Error",
          message: result.message || "Execution completed",

          totalTestCases: result.totalTestCases ?? null,
          executedTestCases: result.executedTestCases ?? null,
          passedTestCases: result.passedTestCases ?? null,
          failedTestCases: result.failedTestCases ?? null,
          failedTestCaseNumber: result.failedTestCaseNumber ?? null,
          unexecutedTestCases: result.unexecutedTestCases ?? null,

          executionTime: result.executionTime ?? null,
          memoryUsed: result.memoryUsed ?? null,

          // Diagnostic details, when available.
          compileOutput: result.compileOutput,
          stderr: result.stderr,
        },
      });
    }

    // Actual BullMQ processing failure, not Wrong Answer.
    if (state === "failed") {
      return res.status(200).json({
        success: true,
        jobId,
        status: "Failed",
        message: job.failedReason || "Submission processing failed",
      });
    }

    const statusMap = {
      waiting: "Queued",
      "waiting-children": "Queued",
      active: "Processing",
      delayed: "Delayed",
      prioritized: "Queued",
      paused: "Queued",
    };

    return res.status(200).json({
      success: true,
      jobId,
      status: statusMap[state] || state,
    });
  } catch (error) {
    console.error(
      "[CONTROLLER] getSubmissionStatus error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch submission status",
    });
  }
};
