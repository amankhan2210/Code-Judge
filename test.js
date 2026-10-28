const BASE_URL = "http://localhost:3000/api/testcase";

const submissionPayload = {
  questionId: "6acf6cb1443bfa646e7735f9",
  language: "cpp",
  sourceCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    void reverseString(vector<char>& s) {
        reverse(s.begin(), s.end());
    }
};`,
};

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120000;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function requestAPI(url, options = {}) {
  console.log(`\n[REQUEST] ${options.method || "GET"} ${url}`);

  const response = await fetch(url, options);
  const responseText = await response.text();

  let data;

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      `Invalid JSON response: ${responseText}`
    );
  }

  console.log("[HTTP STATUS]", response.status);
  console.log("[RESPONSE]", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(
      `API failed with HTTP ${response.status}`
    );
  }

  return data;
}

async function main() {
  try {
    // STEP 1: Submit code
    console.log("\n========== STEP 1: SUBMIT CODE ==========");

    console.log(
      "[PAYLOAD]",
      JSON.stringify(submissionPayload, null, 2)
    );

    const submission = await requestAPI(
      `${BASE_URL}/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionPayload),
      }
    );

    if (!submission.success || !submission.jobId) {
      throw new Error(
        "Submission failed or jobId was not returned"
      );
    }

    // STEP 2: Get dynamic jobId
    const jobId = submission.jobId;

    console.log("\n========== STEP 2: JOB CREATED ==========");
    console.log("[JOB ID]", jobId);
    console.log("[INITIAL STATUS]", submission.status);

    // STEP 3: Poll status using the returned jobId
    const statusUrl =
      `${BASE_URL}/status/${encodeURIComponent(jobId)}`;

    console.log("\n========== STEP 3: CHECK STATUS ==========");

    const startedAt = Date.now();
    let previousResponse = "";

    while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
      const status = await requestAPI(statusUrl);

      const snapshot = JSON.stringify(status);

      if (snapshot === previousResponse) {
        console.log("[INFO] Status unchanged. Waiting...");
      } else {
        console.log("[INFO] Status updated.");
        previousResponse = snapshot;
      }

      // Adjust these fields to match your status controller.
      const state = String(
        status.status ??
        status.state ??
        status.jobState ??
        status.data?.status ??
        ""
      ).toLowerCase();

      if (
        ["completed", "failed", "finished"].includes(state) ||
        status.completed === true ||
        status.finished === true
      ) {
        console.log(
          "\n========== STEP 4: FINAL RESULT =========="
        );

        console.log(
          JSON.stringify(status, null, 2)
        );

        return;
      }

      await sleep(POLL_INTERVAL_MS);
    }

    console.error(
      `[TIMEOUT] No final status after ${
        POLL_TIMEOUT_MS / 1000
      } seconds. Job ID: ${jobId}`
    );
  } catch (error) {
    console.error("\n========== ERROR ==========");
    console.error(error.message);
  }
}

main();