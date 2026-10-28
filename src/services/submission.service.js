const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");
const Question = require("../models/question.model");

const JUDGE0_URL = (
  process.env.JUDGE0_URL || "http://151.242.187.250:2358"
).replace(/\/+$/, "");

const TESTCASE_DIR =
  process.env.TESTCASE_DIR ||
  path.join(__dirname, "../../testcases");

const LANGUAGE_IDS = {
  cpp: 54,
  javascript: 63,
  python: 71,
  java: 62,
};

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 120000;

function getMapValue(map, language) {
  if (!map) return "";

  if (typeof map.get === "function") {
    return map.get(language) || "";
  }

  return map[language] || "";
}

function decodeBase64(value) {
  return value
    ? Buffer.from(value, "base64").toString("utf8")
    : "";
}


async function loadTestCases(questionId) {
  const questionFolder = String(questionId);

  let folderName = questionFolder;

  // First check the normal folder name.
  try {
    await fs.access(
      path.join(TESTCASE_DIR, folderName, "cases.txt")
    );
  } catch {
    // If not found, search for a numbered folder.
    const folders = await fs.readdir(TESTCASE_DIR, {
      withFileTypes: true,
    });

    const matchedFolder = folders.find(
      (folder) =>
        folder.isDirectory() &&
        folder.name.replace(/^\d+\./, "") === questionFolder
    );

    if (!matchedFolder) {
      throw new Error(
        `Testcase folder not found for questionId: ${questionFolder}`
      );
    }

    folderName = matchedFolder.name;
  }

  const filePath = path.join(
    TESTCASE_DIR,
    folderName,
    "cases.txt"
  );

  const content = await fs.readFile(filePath, "utf8");

  const blocks = content
    .split("@@CASE@@")
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    throw new Error("No test cases found");
  }

  return blocks.map((block, index) => {
    const inputMarker = "@@INPUT@@";
    const expectedMarker = "@@EXPECTED@@";
    const endMarker = "@@END@@";

    const inputStart = block.indexOf(inputMarker);
    const expectedStart = block.indexOf(expectedMarker);
    const endStart = block.indexOf(endMarker);

    if (
      inputStart === -1 ||
      expectedStart === -1 ||
      endStart === -1 ||
      inputStart > expectedStart ||
      expectedStart > endStart
    ) {
      throw new Error(
        `Invalid testcase format at case ${index + 1}`
      );
    }

    return {
      input: block
        .slice(inputStart + inputMarker.length, expectedStart)
        .trim(),

      expectedOutput: block
        .slice(expectedStart + expectedMarker.length, endStart)
        .trim(),
    };
  });
}
// Build the batch format consumed by your driver code.
function buildBatchInput(testCases) {
  return (
    testCases
      .map((testCase, index) =>
        [
          `@@CASE ${index + 1}@@`,
          "@@INPUT@@",
          testCase.input,
          "@@EXPECTED@@",
          testCase.expectedOutput,
          "@@END@@",
        ].join("\n")
      )
      .join("\n") + "\n"
  );
}

async function createJudge0Submission({
  sourceCode,
  languageId,
  stdin,
  question,
}) {
  const cpuTimeLimit = Math.max(
    0.1,
    Number(question.timeLimit || 2000) / 1000
  );

  const memoryLimit =
    Number(question.memoryLimit || 256) * 1024;

  const response = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`,
    {
      source_code: Buffer.from(sourceCode, "utf8").toString("base64"),
      language_id: languageId,
      stdin: Buffer.from(stdin, "utf8").toString("base64"),
      cpu_time_limit: cpuTimeLimit,
      cpu_extra_time: 1,
      wall_time_limit: Math.max(10, cpuTimeLimit + 5),
      memory_limit: memoryLimit,
    },
    {
      timeout: 15000,
    }
  );

  if (!response.data?.token) {
    throw new Error("Judge0 did not return a submission token");
  }

  return response.data.token;
}

async function pollJudge0(token) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, POLL_INTERVAL_MS)
    );

    const response = await axios.get(
      `${JUDGE0_URL}/submissions/${encodeURIComponent(token)}?base64_encoded=true`,
      {
        timeout: 10000,
      }
    );

    const data = response.data;

    // 1 = In Queue, 2 = Processing
    if (data.status?.id === 1 || data.status?.id === 2) {
      continue;
    }

    return {
      ...data,
      stdout: decodeBase64(data.stdout),
      stderr: decodeBase64(data.stderr),
      compile_output: decodeBase64(data.compile_output),
      message: decodeBase64(data.message),
    };
  }

  const error = new Error("Judge0 execution polling timed out");
  error.code = "JUDGE0_POLL_TIMEOUT";
  error.judge0Token = token;

  throw error;
}

// Parse PASS 1 / FAIL 2 / TOTAL 2 from driver stdout.
function parseDriverOutput(stdout, expectedTotal, executionStats = {}) {
  const lines = String(stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const results = [];
  let total = null;

  for (const line of lines) {
    const totalMatch = line.match(/^TOTAL\s+(\d+)$/);

    if (totalMatch) {
      if (total !== null) {
        throw new Error("Driver printed TOTAL more than once");
      }

      total = Number(totalMatch[1]);
      continue;
    }

    const resultMatch = line.match(/^(PASS|FAIL)\s+(\d+)$/);

    if (resultMatch) {
      results.push({
        verdict: resultMatch[1],
        testCase: Number(resultMatch[2]),
      });

      continue;
    }

    throw new Error(`Unexpected driver output: ${line}`);
  }

  if (!Number.isInteger(expectedTotal) || expectedTotal < 1) {
    throw new Error("Invalid expected testcase count");
  }

  if (!results.length || total === null) {
    throw new Error("Driver output is incomplete");
  }

  if (total !== results.length) {
    throw new Error(
      `Driver reported TOTAL ${total}, but returned ${results.length} results`
    );
  }

  for (let i = 0; i < results.length; i++) {
    if (results[i].testCase !== i + 1) {
      throw new Error("Invalid driver testcase numbering");
    }
  }

  if (results.length > expectedTotal) {
    throw new Error("Driver executed more test cases than expected");
  }

  const passedTestCases = results.filter(
    (result) => result.verdict === "PASS"
  ).length;

  const failedCase = results.find(
    (result) => result.verdict === "FAIL"
  );

  // Early stop is valid only if a failure was reported.
  if (results.length < expectedTotal && !failedCase) {
    throw new Error(
      `Driver executed only ${results.length} cases; expected ${expectedTotal}, with no failure reported`
    );
  }

  const accepted = !failedCase &&
    results.length === expectedTotal;

  return {
    success: accepted,
    verdict: accepted ? "Accepted" : "Wrong Answer",
    message: failedCase
      ? `Wrong Answer on test case #${failedCase.testCase}`
      : "All test cases passed",

    totalTestCases: expectedTotal,
    executedTestCases: results.length,
    passedTestCases,
    failedTestCases: failedCase ? 1 : 0,
    failedTestCaseNumber: failedCase?.testCase,
    unexecutedTestCases: expectedTotal - results.length,

    executionTime: executionStats.time ?? null,
    memoryUsed: executionStats.memory ?? null,
  };
}

function getJudge0Failure(data) {
  const statusId = data.status?.id;
  const statusDescription =
    data.status?.description || "Execution Error";

  let verdict = statusDescription;

  if (statusId === 4) verdict = "Wrong Answer";
  else if (statusId === 5) verdict = "Time Limit Exceeded";
  else if (statusId === 6) verdict = "Compilation Error";
  else if (statusId === 7) verdict = "Runtime Error (SIGSEGV)";
  else if (statusId === 8) verdict = "Runtime Error (SIGXFSZ)";
  else if (statusId === 9) verdict = "Runtime Error (SIGFPE)";
  else if (statusId === 10) verdict = "Runtime Error (SIGABRT)";
  else if (statusId === 11) verdict = "Runtime Error (NZEC)";
  else if (statusId === 12) verdict = "Runtime Error (Other)";
  else if (statusId === 13) verdict = "Internal Error";
  else if (statusId === 14) verdict = "Exec Format Error";

  return {
    success: false,
    verdict,
    message:
      data.compile_output ||
      data.stderr ||
      data.message ||
      statusDescription,

    executionTime: data.time ?? null,
    memoryUsed: data.memory ?? null,

    compileOutput: data.compile_output || undefined,
    stderr: data.stderr || undefined,
  };
}

async function executeSubmission({
  questionId,
  language,
  sourceCode,
}) {
  if (!mongoose.isValidObjectId(questionId)) {
    throw new Error(`Invalid questionId: ${questionId}`);
  }

  if (typeof language !== "string" || !language.trim()) {
    throw new Error("Language is required");
  }

  if (typeof sourceCode !== "string" || !sourceCode.trim()) {
    throw new Error("Source code is required");
  }

  const languageKey = language.trim().toLowerCase();
  const languageId = LANGUAGE_IDS[languageKey];

  if (!languageId) {
    throw new Error(`Unsupported language: ${languageKey}`);
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error("Worker MongoDB connection is not ready");
  }

  const question = await Question.findById(questionId).exec();

  if (!question) {
    throw new Error(`Question not found: ${questionId}`);
  }

  if (
    question.supportedLanguages?.length &&
    !question.supportedLanguages.includes(languageKey)
  ) {
    throw new Error("Language is not supported");
  }

  const helperCode = getMapValue(
    question.helperCode,
    languageKey
  );

  const driverCode = getMapValue(
    question.driverCode,
    languageKey
  );

  if (!driverCode.trim()) {
    throw new Error(`Driver code is missing for ${languageKey}`);
  }

  // Read fresh testcase file for each execution.
  const testCases = await loadTestCases(questionId);

  const stdin = buildBatchInput(testCases);

  const fullSourceCode = [
    helperCode,
    sourceCode,
    driverCode,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n\n");

  const token = await createJudge0Submission({
    sourceCode: fullSourceCode,
    languageId,
    stdin,
    question,
  });

  const result = await pollJudge0(token);

  // Judge0 status 3 means the program executed successfully.
  // Your driver reports individual testcase PASS/FAIL results.
  if (result.status?.id !== 3) {
    return getJudge0Failure(result);
  }

  return parseDriverOutput(
    result.stdout,
    testCases.length,
    {
      time: result.time,
      memory: result.memory,
    }
  );
}

module.exports = {
  executeSubmission,
};
