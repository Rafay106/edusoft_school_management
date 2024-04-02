const asyncHandler = require("express-async-handler");
const OneSignal = require("onesignal-node");
const { default: axios } = require("axios");
const StuAttNotify = require("../models/attendance/stuAttNotifyModel");
const Student = require("../models/studentInfo/studentModel");

const storeStuAttNotification = async (msg, studentId, date, bus) => {
  const stu = await Student.findById(studentId).select("manager school");

  await StuAttNotify.create({
    date,
    msg,
    student: stu._id,
    bus,
    manager: stu.manager,
    school: stu.school,
  });
};

const sendNotifications = asyncHandler(async () => {
  const notifications = await StuAttNotify.find({ sent: false })
    .sort("createdBy")
    .limit(10)
    .lean();

  const client = new OneSignal.Client(
    process.env.ONESIGNAL_APP_ID,
    process.env.ONESIGNAL_API_KEY
  );

  for (const noty of notifications) {
    const notification = {
      contents: {
        en: noty.msg,
      },
      include_external_user_ids: [noty.student], // schoolId
    };

    try {
      const response = await client.createNotification(notification);
      console.log(response.body.id);

      await StuAttNotify.updateOne({ _id: noty._id }, { $set: { sent: true } });
    } catch (e) {
      if (e instanceof OneSignal.HTTPError) {
        console.log(e.statusCode);
        console.log(e.body);
      } else console.log(e);
    }
  }
});

module.exports = {
  storeStuAttNotification,
  sendNotifications,
};
