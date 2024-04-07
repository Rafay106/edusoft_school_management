const asyncHandler = require("express-async-handler");
const OneSignal = require("onesignal-node");
const { default: axios } = require("axios");
const StuAttNotify = require("../models/attendance/stuAttNotifyModel");
const Student = require("../models/studentInfo/studentModel");

const storeStuAttNotification = async (msg, studentId, date, bus) => {
  const stu = await Student.findById(studentId).select("manager school");

  await StuAttNotify.create({ date, msg, student: stu._id, bus });
};

const sendNotifications = asyncHandler(async () => {
  const notifications = await StuAttNotify.find({ sent: false })
    .populate("student", "school")
    .sort("createdBy")
    .limit(10)
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

  await StuAttNotify.updateMany(
    { _id: sentNotifications },
    { $set: { sent: true } }
  );
});

module.exports = {
  storeStuAttNotification,
  sendNotifications,
};
