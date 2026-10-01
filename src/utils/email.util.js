// module.exports = SendGenOtp
const sendEmail = require("../services/email.service");

async function SendOtpEmail(email,otp) {

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Elevate - Email Verification</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #080a08;
    font-family: Arial, Helvetica, sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0"
    style="background-color: #080a08; padding: 40px 15px;">

    <tr>
        <td align="center">

            <!-- Main Container -->
            <table width="600" cellpadding="0" cellspacing="0"
                style="
                    max-width: 600px;
                    width: 100%;
                    background-color: #111410;
                    border: 1px solid #292e25;
                    border-radius: 16px;
                    overflow: hidden;
                ">

                <!-- Top Accent -->
                <tr>
                    <td style="
                        height: 4px;
                        background-color: #B8FF00;
                        font-size: 0;
                        line-height: 0;
                    ">&nbsp;</td>
                </tr>

                <!-- Header -->
                <tr>
                    <td align="center" style="padding: 40px 30px 25px;">

                        <h1 style="
                            margin: 0;
                            color: #ffffff;
                            font-size: 30px;
                            font-weight: 800;
                            letter-spacing: -1px;
                        ">
                            CODE <span style="color: #B8FF00;">ELEVATE</span>
                        </h1>

                        <p style="
                            margin: 10px 0 0;
                            color: #777d70;
                            font-size: 11px;
                            letter-spacing: 4px;
                            text-transform: uppercase;
                        ">
                            Learn. Build. Elevate.
                        </p>

                    </td>
                </tr>

                <!-- Divider -->
                <tr>
                    <td style="padding: 0 40px;">
                        <div style="
                            height: 1px;
                            background-color: #292e25;
                        "></div>
                    </td>
                </tr>

                <!-- Main Content -->
                <tr>
                    <td style="padding: 40px 40px 20px;">

                        <p style="
                            margin: 0 0 15px;
                            color: #B8FF00;
                            font-size: 12px;
                            font-weight: bold;
                            letter-spacing: 2px;
                            text-transform: uppercase;
                        ">
                            Account Security
                        </p>

                        <h2 style="
                            margin: 0 0 18px;
                            color: #ffffff;
                            font-size: 28px;
                            line-height: 1.3;
                            font-weight: 700;
                        ">
                            Verify Your<br>
                            <span style="color: #B8FF00;">Email Address.</span>
                        </h2>

                        <p style="
                            margin: 0;
                            color: #a1a69b;
                            font-size: 15px;
                            line-height: 1.8;
                        ">
                            Welcome to Code Elevate. Use the verification
                            code below to securely complete your
                            authentication and get started.
                        </p>

                        <!-- Email Address -->
                        <table width="100%" cellpadding="0" cellspacing="0"
                            style="
                                margin-top: 25px;
                                background-color: #191d16;
                                border: 1px solid #292e25;
                                border-radius: 10px;
                            ">
                            <tr>
                                <td style="padding: 16px 20px;">

                                    <p style="
                                        margin: 0 0 7px;
                                        color: #777d70;
                                        font-size: 11px;
                                        letter-spacing: 1.5px;
                                        text-transform: uppercase;
                                    ">
                                        Verification requested for
                                    </p>

                                    <p style="
                                        margin: 0;
                                        color: #B8FF00;
                                        font-size: 15px;
                                        font-weight: bold;
                                        word-break: break-word;
                                    ">
                                        ${email}
                                    </p>

                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                <!-- OTP Section -->
                <tr>
                    <td align="center" style="padding: 25px 30px 30px;">

                        <p style="
                            margin: 0 0 15px;
                            color: #777d70;
                            font-size: 12px;
                            letter-spacing: 2px;
                            text-transform: uppercase;
                        ">
                            Your Verification Code
                        </p>

                        <table cellpadding="0" cellspacing="0"
                            style="
                                background-color: #1a2014;
                                border: 1px solid #B8FF00;
                                border-radius: 12px;
                            ">
                            <tr>
                                <td align="center" style="
                                    padding: 22px 35px;
                                    color: #B8FF00;
                                    font-size: 36px;
                                    font-weight: 800;
                                    letter-spacing: 12px;
                                ">
                                    ${otp}
                                </td>
                            </tr>
                        </table>

                        <p style="
                            margin: 20px 0 0;
                            color: #a1a69b;
                            font-size: 14px;
                        ">
                            This code expires in
                            <strong style="color: #B8FF00;">
                                10 minutes
                            </strong>.
                        </p>

                    </td>
                </tr>

                <!-- Security Notice -->
                <tr>
                    <td style="padding: 10px 40px 35px;">

                        <table width="100%" cellpadding="0" cellspacing="0"
                            style="
                                background-color: #191d16;
                                border-left: 3px solid #B8FF00;
                            ">
                            <tr>
                                <td style="padding: 18px 20px;">

                                    <p style="
                                        margin: 0;
                                        color: #a1a69b;
                                        font-size: 13px;
                                        line-height: 1.7;
                                    ">
                                        <strong style="color: #ffffff;">
                                            Security Notice
                                        </strong><br>
                                        Never share this verification code
                                        with anyone. Code Elevate will never
                                        ask you for your OTP.
                                    </p>

                                </td>
                            </tr>
                        </table>

                        <p style="
                            margin: 25px 0 0;
                            color: #777d70;
                            font-size: 13px;
                            line-height: 1.7;
                            text-align: center;
                        ">
                            If you did not request this code, you can
                            safely ignore this email.
                        </p>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td align="center" style="
                        background-color: #0c0e0b;
                        border-top: 1px solid #292e25;
                        padding: 28px 20px;
                    ">

                        <p style="
                            margin: 0;
                            color: #ffffff;
                            font-size: 17px;
                            font-weight: bold;
                        ">
                            CODE <span style="color: #B8FF00;">ELEVATE</span>
                        </p>

                        <p style="
                            margin: 10px 0 0;
                            color: #777d70;
                            font-size: 12px;
                            line-height: 1.6;
                        ">
                            Empowering developers to build a better future.
                        </p>

                        <p style="
                            margin: 20px 0 0;
                            color: #555b50;
                            font-size: 11px;
                        ">
                            © 2026 Code Elevate. All rights reserved.
                        </p>

                    </td>
                </tr>

            </table>
            <!-- End Main Container -->

        </td>
    </tr>

</table>

</body>
</html>
`;

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