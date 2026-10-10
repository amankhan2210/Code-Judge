// module.exports = SendGenOtp
const sendEmail = require("../services/email.service");

async function SendOtpEmail(email,otp) {

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeElevate - Email Verification</title>
    <!-- Matches the CodeElevate landing-page typography; fallbacks support email clients. -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
</head>

<body style="margin:0;padding:0;background-color:#080b16;font-family:'DM Sans',Arial,Helvetica,sans-serif;color:#f3f4f8;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#080b16;padding:40px 15px;">
    <tr>
        <td align="center">

            <!-- Main Container -->
            <table width="600" cellpadding="0" cellspacing="0" role="presentation"
                style="max-width:600px;width:100%;background-color:#0d1220;border:1px solid #252b43;border-radius:16px;overflow:hidden;">

                <!-- Top Accent -->
                <tr>
                    <td style="height:4px;background:linear-gradient(90deg,#7658f4 0%,#a855f7 58%,#22d3ee 100%);font-size:0;line-height:0;">&nbsp;</td>
                </tr>

                <!-- Header -->
                <tr>
                    <td align="center" style="padding:36px 30px 25px;">
                        <h1 style="margin:0;color:#f3f4f8;font-family:'Space Grotesk','DM Sans',Arial,sans-serif;font-size:29px;line-height:1.2;font-weight:700;letter-spacing:-1.2px;">
                            Code<span style="color:#a996ff;">Elevate</span>
                        </h1>
                        <p style="margin:10px 0 0;color:#8792ac;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">
                            Learn. Build. Elevate.
                        </p>
                    </td>
                </tr>

                <!-- Divider -->
                <tr>
                    <td style="padding:0 40px;">
                        <div style="height:1px;background-color:#252b43;font-size:0;line-height:0;">&nbsp;</div>
                    </td>
                </tr>

                <!-- Main Content -->
                <tr>
                    <td style="padding:38px 40px 18px;">
                        <p style="margin:0 0 14px;color:#a996ff;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;">
                            Account Security
                        </p>

                        <h2 style="margin:0 0 17px;color:#f3f4f8;font-family:'Space Grotesk','DM Sans',Arial,sans-serif;font-size:29px;line-height:1.25;font-weight:700;letter-spacing:-1px;">
                            Verify Your<br>
                            <span style="color:#a996ff;">Email Address.</span>
                        </h2>

                        <p style="margin:0;color:#a4aec4;font-size:14px;line-height:1.85;">
                            Welcome to CodeElevate. Use the verification
                            code below to securely complete your
                            authentication and get started.
                        </p>

                        <!-- Email Address -->
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                            style="margin-top:24px;background-color:#11182a;border:1px solid #252b43;border-radius:10px;">
                            <tr>
                                <td style="padding:16px 19px;">
                                    <p style="margin:0 0 7px;color:#8792ac;font-size:10px;font-weight:600;letter-spacing:1.3px;text-transform:uppercase;">
                                        Verification requested for
                                    </p>
                                    <p style="margin:0;color:#22d3ee;font-size:14px;font-weight:700;word-break:break-word;">
                                       ${email}
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- OTP Section -->
                <tr>
                    <td align="center" style="padding:22px 30px 30px;">
                        <p style="margin:0 0 15px;color:#8792ac;font-size:11px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;">
                            Your Verification Code
                        </p>

                        <table cellpadding="0" cellspacing="0" role="presentation"
                            style="background-color:#17152d;border:1px solid #8b6cff;border-radius:12px;">
                            <tr>
                                <td align="center" style="padding:21px 32px;color:#b5a4ff;font-family:'Space Grotesk','DM Sans',Arial,sans-serif;font-size:35px;line-height:1.2;font-weight:700;letter-spacing:10px;">
                                    ${otp}
                                </td>
                            </tr>
                        </table>

                        <p style="margin:19px 0 0;color:#a4aec4;font-size:13px;line-height:1.7;">
                            This code expires in
                            <strong style="color:#22d3ee;">10 minutes</strong>.
                        </p>
                    </td>
                </tr>

                <!-- Security Notice -->
                <tr>
                    <td style="padding:8px 40px 34px;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                            style="background-color:#11182a;border:1px solid #252b43;border-left:3px solid #8b6cff;border-radius:7px;">
                            <tr>
                                <td style="padding:17px 19px;">
                                    <p style="margin:0;color:#a4aec4;font-size:12px;line-height:1.8;">
                                        <strong style="color:#f3f4f8;font-family:'Space Grotesk','DM Sans',Arial,sans-serif;">
                                            Security Notice
                                        </strong><br>
                                        Never share this verification code with anyone. CodeElevate will never ask you for your OTP.
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:23px 0 0;color:#8792ac;font-size:12px;line-height:1.8;text-align:center;">
                            If you did not request this code, you can safely ignore this email.
                        </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td align="center" style="background-color:#090d18;border-top:1px solid #252b43;padding:27px 20px;">
                        <p style="margin:0;color:#f3f4f8;font-family:'Space Grotesk','DM Sans',Arial,sans-serif;font-size:17px;font-weight:700;letter-spacing:-.5px;">
                            Code<span style="color:#a996ff;">Elevate</span>
                        </p>
                        <p style="margin:10px 0 0;color:#8792ac;font-size:11px;line-height:1.7;">
                            Empowering developers to build a better future.
                        </p>
                        <p style="margin:19px 0 0;color:#59647d;font-size:10px;">
                            © 2026 CodeElevate. All rights reserved.
                        </p>
                    </td>
                </tr>

            </table>
            <!-- End Main Container -->

        </td>
    </tr>
</table>

</body>
</html>`;

  // Send email through Brevo
  await sendEmail(
    email,
    "Verify Your Email",
    `Your OTP is ${otp}`,
    htmlTemplate
  );

  // Return OTP to controller
  return otp;
}

module.exports = SendOtpEmail;