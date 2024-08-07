const OneSignal = require("onesignal-node");
const PushQ = require("../models/queues/pushQueueModel");
const { addJobToPushQueue } = require("./bullmq/queues");
const C = require("../constants");
const UC = require("../utils/common");
const { default: axios } = require("axios");
const User = require("../models/system/userModel");
const PushNotification = require("../models/system/pushNotificationModel");

const sendPushQueue = async (receivers, type, title, msg, media, sound) => {
  const data = {
    title,
    msg,
    media,
    sound,
    receivers,
  };

  const pushQ = await PushQ.create(data);

  await addJobToPushQueue(pushQ._id.toString(), data);

  for (const r of receivers) {
    if (await User.any({ _id: r })) {
      const pn = await PushNotification.create({
        type,
        msg,
        media: media?.app,
        user: r,
      });
    } else {
      UC.writeLog(
        "push_notification",
        `Error: recevier not found in User. ${r}, ${type}, ${title}, ${msg}`
      );
    }
  }

  return receivers.length;
};

const sendPushNotification_v1 = async (receivers, title, msg, media, sound) => {
  const client = new OneSignal.Client(
    process.env.ONESIGNAL_APP_ID,
    process.env.ONESIGNAL_API_KEY
  );

  const notification = {
    headings: { en: title },
    contents: { en: msg },
    include_external_user_ids: receivers,
  };

  if (media && media.app !== "") notification.big_picture = media.app;
  if (media && media.web !== "") notification.chrome_web_image = media.web;

  if (sound && sound.android !== "") notification.android_sound = sound.android;
  if (sound && sound.ios !== "") notification.ios_sound = sound.ios;

  try {
    const response = await client.createNotification(notification);
    console.log(response);

    UC.writeLog("send_push", `Response: ${JSON.stringify(response)}`);

    return true;
  } catch (e) {
    if (e instanceof OneSignal.HTTPError) {
      console.log(e.statusCode);
      console.log(e.body);
    } else console.log(e);

    UC.writeLog(
      "send_push",
      `Error: ${JSON.stringify(e)} | Message ${e.message}`
    );
    return false;
  }
};

const sendPushNotification = async (receivers, title, msg, media, sound) => {
  const notification = {
    app_id: process.env.ONESIGNAL_APP_ID,
    include_external_user_ids: receivers,
    contents: { en: msg },
    headings: { en: title },
    name: "INTERNAL_CAMPAIGN_NAME",
  };

  if (media && media.app !== "") notification.big_picture = media.app;
  if (media && media.web !== "") notification.chrome_web_image = media.web;

  if (sound && sound.android !== "") notification.android_sound = sound.android;
  if (sound && sound.ios !== "") notification.ios_sound = sound.ios;

  try {
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      notification,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
        },
      }
    );

    UC.writeLog("send_push", `Response: ${JSON.stringify(response.data)}`);

    return true;
  } catch (e) {
    console.log(e);

    UC.writeLog(
      "send_push",
      `Error: ${JSON.stringify(e)} | Message ${e.message}`
    );
    return false;
  }
};

module.exports = { sendPushQueue, sendPushNotification };
