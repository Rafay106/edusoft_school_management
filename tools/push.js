const OneSignal = require("onesignal-node");
const PushQ = require("../models/queues/pushQueueModel");
const { addJobToPushQueue } = require("./bullmq/queues");
const UC = require("../utils/common");

const sendPushQueue = async (receivers, title, msg, media, sound) => {
  const data = {
    title,
    msg,
    media,
    sound,
    receivers,
  };

  const pushQ = await PushQ.create(data);

  await addJobToPushQueue(pushQ._id.toString(), data);

  return receivers.length;
};

const sendPushNotification = async (receivers, title, msg, media, sound) => {
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

module.exports = { sendPushQueue, sendPushNotification };
