const path = require("node:path");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const C = require("../constants");
const UC = require("../utils/common");
const EmailQ = require("../models/queues/emailQueueModel");
const { addJobToEmailQueue } = require("./bullmq/queues");
const {
  GMAIL,
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URL,
  GMAIL_REFRESH_TOKEN,
} = process.env;

const sendEmailQueue = async (to, subject, text, html, attachments) => {
  const data = {
    to,
    subject,
    text,
    html,
    attachments,
  };

  const emailQueue = await EmailQ.create(data);

  await addJobToEmailQueue(emailQueue._id.toString(), data);

  if (emailQueue) {
    // multiple emails
    return to.length;
  } else {
    return false;
  }
};

const sendEmail = async (toArr, subject, text, html, attachments = false) => {
  const transporterOptions = {
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: GMAIL,
      clientId: GMAIL_CLIENT_ID,
      clientSecret: GMAIL_CLIENT_SECRET,
      refreshToken: GMAIL_REFRESH_TOKEN,
    },
    debug: false,
    logger: false,
  };

  const client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URL
  );

  client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

  try {
    const accessToken = await client.getAccessToken();

    transporterOptions.auth.accessToken = accessToken;

    const transporter = nodemailer.createTransport(transporterOptions);

    const mailOptions = { from: `Edusoft <${GMAIL}>`, subject, text, html };

    if (attachments) {
      mailOptions.attachments = attachments.map((ele) => ({
        filename: path.basename(ele),
        path: ele,
      }));
    }

    for (const to of toArr) {
      mailOptions.to = to;

      const result = await transporter.sendMail(mailOptions);

      UC.writeLog(
        "send_email",
        `Accepted: ${result.accepted.toString()} | Rejected: ${result.rejected.toString()} | Response: ${
          result.response
        }`
      );
    }

    return true;
  } catch (err) {
    console.log(err);
    UC.writeLog("errors", `Error (./tools/email.js): ${JSON.stringify(err)}`);
    return false;
  }
};

module.exports = {
  sendEmailQueue,
  sendEmail,
};
