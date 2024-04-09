const asyncHandler = require("express-async-handler");
const OneSignal = require("onesignal-node");
const StuAttEvent = require("../models/attendance/stuAttEventModel");
const QueueStuAtt = require("../models/attendance/stuAttQueueModel");

const stuAttEvent = async (msg, studentId, date, bus) => {
  await StuAttEvent.create({ msg, date, student: studentId, bus });
  await QueueStuAtt.create({ msg, student: studentId });
};

const sendNotifications = asyncHandler(async () => {
  const notifications = await QueueStuAtt.find()
    .populate("student", "school")
    .sort("dt")
    .limit(100)
    .lean();

  const client = new OneSignal.Client(
    process.env.ONESIGNAL_APP_ID,
    process.env.ONESIGNAL_API_KEY
  );

  const sentNotifications = [];

  for (const noty of notifications) {
    const notification = {
      contents: {
        en: noty.msg,
      },
      include_external_user_ids: [noty.student._id, noty.student.school],
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

  await QueueStuAtt.deleteMany({ _id: sentNotifications });
});

module.exports = {
  stuAttEvent,
  sendNotifications,
};
