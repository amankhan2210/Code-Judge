
require("dotenv").config();

const SibApiV3Sdk = require("sib-api-v3-sdk");

// ======================================================
// BREVO CLIENT
// ======================================================

const defaultClient =
  SibApiV3Sdk.ApiClient.instance;

// Brevo API Key
defaultClient.authentications[
  "api-key"
].apiKey = process.env.BREVO_API_KEY;

// ======================================================
// BREVO TRANSACTIONAL EMAIL API
// ======================================================

const apiInstance =
  new SibApiV3Sdk.TransactionalEmailsApi();

// ======================================================
// SEND EMAIL
// ======================================================

const sendEmail = async (
  to,
  subject,
  text,
  html
) => {
  try {
    const sendSmtpEmail =
      new SibApiV3Sdk.SendSmtpEmail();

    // Sender
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || "CODE ELEVATE",
      email: process.env.BREVO_SENDER_EMAIL,
    };

    // Receiver
    sendSmtpEmail.to = [
      {
        email: to,
      },
    ];

    // Subject
    sendSmtpEmail.subject = subject;

    // Plain text
    sendSmtpEmail.textContent = text;

    // HTML
    sendSmtpEmail.htmlContent = html;

    // Send
    const response =
      await apiInstance.sendTransacEmail(
        sendSmtpEmail
      );

    console.log(
      "✅ Brevo email sent successfully"
    );

    console.log(
      "Brevo response:",
      response
    );

    return response;

  } catch (error) {

    console.error(
      "❌ Brevo email sending failed"
    );

    console.error(
      error.response?.body ||
      error.response?.data ||
      error.message ||
      error
    );

    // VERY IMPORTANT
    // Don't silently continue.
    throw error;
  }
};

module.exports = sendEmail;