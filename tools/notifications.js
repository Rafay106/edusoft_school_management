const OneSignal = require("onesignal-node");
const { default: axios } = require("axios");

const PushQ = require("../models/queues/pushQueueModel");
const EmailQ = require("../models/queues/emailQueueModel");
const WhatsAppQ = require("../models/queues/whatsappQueueModel");

const sendPushNoty = async () => {
  const notifications = await PushQ.find().sort("dt").limit(100).lean();

  const client = new OneSignal.Client(
    process.env.ONESIGNAL_APP_ID,
    process.env.ONESIGNAL_API_KEY
  );

  const sentNotifications = [];

  for (const noty of notifications) {
    const notification = {
      contents: { en: noty.msg },
      include_external_user_ids: noty.receivers,
    };

    try {
      const response = await client.createNotification(notification);
      console.log(response.body.id);
      sentNotifications.push(noty._id);
    } catch (e) {
      if (e instanceof OneSignal.HTTPError) {
        console.log(e.statusCode);
        console.log(e.body);
      } else console.log(e);
    }
  }

  await PushQ.deleteMany({ _id: sentNotifications });
};

const sendEmailNoty = async () => {
  const noties = await EmailQ.find().sort("dt").limit(100).lean();

  const url = "https://onesignal.com/api/v1/notifications";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Basic ${REST_API_KEY}`,
  };

  const sentNoties = [];
  for (const noty of noties) {
    const data = {
      app_id: ONESIGNAL_APP_ID,
      include_email_tokens: noty.receivers,
      email_subject: noty.subject,
      email_body: noty.body,
      isEmail: true,
    };

    try {
      const response = await axios.post(url, data, { headers });
      console.log("Email sent successfully:", response.data);

      sentNoties.push(noty._id);
    } catch (error) {
      console.error(
        "Error sending email:",
        error.response ? error.response.data : error.message
      );
    }
  }

  await EmailQ.deleteMany({ _id: sentNoties });
};

const sendWhatsappNoty = async () => {
  const noties = await WhatsAppQ.find().sort("dt").limit(100).lean();

  const AISENSY_API_KEY = "YOUR_AISENSY_API_KEY";

  const url = "https://app.aisensy.com/api/v1.0/message/send";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${AISENSY_API_KEY}`,
  };

  const sentNoties = [];
  for (const noty of noties) {
    for (const phone of noty.receivers) {
      const data = {
        phone_number: phone,
        message: noty.body,
      };

      try {
        const response = await axios.post(url, data, { headers });
        console.log("WhatsApp message sent successfully:", response.data);

        if (!sentNoties.includes(noty._id)) sentNoties.push(noty._id);
      } catch (error) {
        console.error(
          "Error sending WhatsApp message:",
          error.response ? error.response.data : error.message
        );
      }
    }
  }

  await WhatsAppQ.deleteMany({ _id: sentNoties });
};

module.exports = {
  sendPushNoty,
  sendEmailNoty,
  sendWhatsappNoty,
};
