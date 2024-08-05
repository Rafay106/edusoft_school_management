const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("child_process");
const ftp = require("basic-ftp");
const { default: axios } = require("axios");
const C = require("../constants");
const UC = require("../utils/common");
const getDeviceHistoryModel = require("../models/system/deviceHistoryModel");
const { insert_db_loc } = require("./insert");
const { sendEmail, sendEmailQueue } = require("../tools/email");
const { sendPushNotification } = require("../tools/push");
const { sendWhatsapp } = require("../tools/whatsapp_aisensy");
const mongoose = require("mongoose");
const SystemInfo = require("../models/system/systemInfoModel");
const Bus = require("../models/transport/busModel");
const Student = require("../models/studentInfo/studentModel");
const School = require("../models/system/schoolModel");
const IssueBooks = require("../models/library/issueBookModel");
const User = require("../models/system/userModel");
const EmailQ = require("../models/queues/emailQueueModel");
const PushQ = require("../models/queues/pushQueueModel");
const WhatsAppQ = require("../models/queues/whatsappQueueModel");

const {
  MONGO_URI,
  DOMAIN,
  NAME,
  DB_BACKUP_EMAILS,
  DB_BACKUP_FTP_UPLOAD,
  FTP_HOST,
  FTP_USER,
  FTP_PASS,
  FTP_BACKUP_DIR,
} = process.env;

const serviceDbBackup = async () => {
  if (DB_BACKUP_EMAILS === "") return false;

  const backupEmails = DB_BACKUP_EMAILS.split(",");

  if (backupEmails.length === 0) return false;

  // check when last time sent
  const sysInfo = await SystemInfo.findOne({ key: C.DB_BACKUP_TIME_LAST });

  if (sysInfo) {
    const now = new Date();

    // Backup time last
    const btLast = new Date(sysInfo.value);

    // If backup is done today then don't backup again
    if (
      btLast.getFullYear() === now.getFullYear() &&
      btLast.getMonth() === now.getMonth() &&
      btLast.getDate() === now.getDate()
    )
      return false;
  } else {
    await SystemInfo.create({
      key: C.DB_BACKUP_TIME_LAST,
      value: new Date().toISOString(),
    });
  }

  const backupFolder = path.join("backup");
  if (!fs.existsSync(backupFolder)) fs.mkdirSync(backupFolder);

  const FILE_NAME = `db_${UC.getYMD()}.gz`;

  const collections = (await mongoose.connection.listCollections())
    .map((ele) => ele.name)
    .sort();

  const collectionsToExclude = collections
    .filter((ele) => /device_\d+/.test(ele) || /queue_[a-z]/.test(ele))
    .sort();

  const collectionCmds = collectionsToExclude.map(
    (c) => `--excludeCollection=${c}`
  );

  // Run the mongodump command
  const result = spawnSync("mongodump", [
    `--uri=${MONGO_URI}`,
    `--archive=./backup/${FILE_NAME}`,
    ...collectionCmds,
    "--gzip",
  ]);

  if (result.error) {
    UC.writeLog("DB_BACKUP", `spawnSync.error: ${result.error}`);

    return false;
  }

  if (result.stdout.byteLength) {
    UC.writeLog("DB_BACKUP", `stdout:\n${result.stdout.toString("ascii")}`);
  }

  if (result.stderr.byteLength) {
    UC.writeLog("DB_BACKUP", `stderr:\n${result.stderr.toString("ascii")}`);
  }

  if (result.status !== 0) {
    UC.writeLog(
      "DB_BACKUP",
      `Database backup is unsuccessful | spawnSync.status ${result.status}`
    );

    // Send file via email
    const templatePath = path.join("templates", "db-backup-email-failure.html");
    const html = fs
      .readFileSync(templatePath, "utf8")
      .replaceAll("{{company}}", NAME)
      .replaceAll("{{year}}", new Date().getFullYear());

    await sendEmailQueue(
      backupEmails,
      `${NAME}: Database Backup Failed`,
      "",
      html
    );

    return false;
  }

  UC.writeLog("DB_BACKUP", "Database backup is successful ✅.\n");

  await SystemInfo.updateOne(
    { key: C.DB_BACKUP_TIME_LAST },
    { $set: { value: new Date().toISOString() } }
  );

  // Send file to ftp
  let isUploadedToFTP = false;
  if (DB_BACKUP_FTP_UPLOAD === "true") {
    const client = new ftp.Client();

    try {
      await client.access({
        host: FTP_HOST,
        user: FTP_USER,
        password: FTP_PASS,
        secure: false,
      });

      const localFilePath = path.join("backup", FILE_NAME);

      await client.uploadFrom(localFilePath, FTP_BACKUP_DIR + FILE_NAME);

      isUploadedToFTP = true;

      UC.writeLog("DB_BACKUP", "Database backup uploaded to FTP\n");
    } catch (err) {
      UC.writeLog("DB_BACKUP", `Error uploading backup to FTP: ${err.message}`);
      console.error("Error uploading file:", err);
    } finally {
      client.close();
    }
  }

  // Send file via email
  const templatePath = path.join("templates", "db-backup-email-success.html");
  const html = fs
    .readFileSync(templatePath, "utf8")
    .replaceAll("{{company}}", NAME)
    .replaceAll("{{year}}", new Date().getFullYear());

  await sendEmailQueue(
    backupEmails,
    `${NAME}: Database Backup Successful`,
    "",
    html
  );

  return true;
};

const serviceClearHistory = async () => {
  const days = parseInt(process.env.HISTORY_PERIOD);

  if (!days || isNaN(days)) return;

  if (days < 30) return;

  const buses = await Bus.find().select("device.imei").sort("imei");

  for (const bus of buses) {
    const DeviceHistory = getDeviceHistoryModel(bus.device.imei);

    await DeviceHistory.deleteMany({
      dt_tracker: {
        $lt: new Date().setUTCDate(new Date().getUTCDate() - days),
      },
    });
  }
};

const serviceResetAlternateBus = async () => {
  await Bus.updateMany(
    { "alternate.enabled": true },
    { $set: { "alternate.enabled": false } }
  );
};

const serviceResetTempBusDevice = async () => {
  await Bus.updateMany(
    { "temp_device.enabled": true },
    { $set: { "temp_device.enabled": false } }
  );
};

const serviceResetCurrAcademicYear = async () => {
  const SCHOOLS = await School.find().select("current_academic_year").lean();

  for (const SCHOOL of SCHOOLS) {
    if (!SCHOOL.current_academic_year) continue;

    const USERS = await User.find({ school: SCHOOL._id })
      .select("current_academic_year")
      .lean();

    await User.updateMany(
      { _id: USERS.map((u) => u._id) },
      { $set: { current_academic_year: SCHOOL.current_academic_year } }
    );
  }
};

const serviceInsertData = async () => {
  const { data } = await axios.get(
    `https://www.speedotrack.in/api/api.php?api=user&ver=1.0&key=6DBC43AC16B9126419E52DEA3753EB30&cmd=USER_GET_OBJECTS`
  );

  for (const device of data) {
    const loc = {
      altitude: device.altitude,
      angle: device.angle,
      dt_server: new Date(),
      dt_tracker: device.dt_tracker,
      event: device.event,
      imei: device.imei,
      ip: device.ip,
      lat: device.lat,
      lon: device.lng,
      loc_valid: device.loc_valid,
      net_protocol: device.net_protocol,
      params: device.params,
      port: device.port,
      protocol: device.protocol,
      speed: device.speed,
    };

    await insert_db_loc(loc);
  }
};

const serviceCalculateOverdueAndApplyFine = async () => {
  try {
    const schools = await School.find();
    const issueBooks = await IssueBooks.find();

    for (const issueBook of issueBooks) {
      const school = schools.find((sch) => sch._id.equals(issueBook.school));
      if (school) {
        const current_date = new Date();
        const issue_date = issueBook.issued_date;
        const fine_per_day = school.library.fine_per_day;
        const overDueDays = Math.max(
          0,
          Math.ceil((current_date - issue_date) / (1000 * 60 * 60 * 24))
        );
        if (overDueDays > 0) {
          const fine = overDueDays * fine_per_day;
          const student = Student.findById(issueBook.student);

          // Apply fine to the student's record
          student.fine += fine;
          await student.save();

          // await issueBooks.updateOne({_id:issueBook._id},{$set:{fine : fine } });
        }
      }
    }
  } catch (err) {
    console.error("issue books and schools not found", err);
  }
};

const serviceEmailQueue = async () => {
  console.log("*****serviceEmailQueue() START*****");
  const emailQ = await EmailQ.find({ sending: false })
    .sort("-dt")
    .limit(100)
    .lean();

  const ids = emailQ.map((ele) => ele._id);

  await EmailQ.updateMany({ _id: ids }, { $set: { sending: true } });

  const sent = [];
  for (const eq of emailQ) {
    const result = await sendEmail(
      eq.to,
      eq.subject,
      eq.text,
      eq.html,
      eq.attachments
    );

    if (result) sent.push(eq._id);
    else await EmailQ.updateOne({ _id: eq._id }, { $set: { sending: false } });
  }

  await EmailQ.deleteMany({ _id: sent });
};

const servicePushQueue = async () => {
  console.log("*****servicePushQueue() START*****");
  const pushQ = await PushQ.find({ sending: false })
    .sort("-dt")
    .limit(100)
    .lean();

  const ids = pushQ.map((ele) => ele._id);

  await PushQ.updateMany({ _id: ids }, { $set: { sending: true } });

  const sent = [];
  for (const p of pushQ) {
    const result = await sendPushNotification(
      p.receivers,
      p.title,
      p.msg,
      p.media,
      p.sound
    );

    if (result) sent.push(p._id);
    else await PushQ.updateOne({ _id: p._id }, { $set: { sending: true } });
  }

  await PushQ.deleteMany({ _id: sent });
};

const serviceWhatsappQueue = async () => {
  console.log("*****serviceWhatsappQueue() START*****");
  const whatsappQ = await WhatsAppQ.find({ sending: false })
    .sort("-dt")
    .limit(100)
    .lean();

  const ids = whatsappQ.map((ele) => ele._id);

  await WhatsAppQ.updateMany({ _id: ids }, { $set: { sending: true } });

  const sent = [];
  for (const wq of whatsappQ) {
    for (const destination of wq.destinations) {
      const result = await sendWhatsapp(
        wq.campaignName,
        destination,
        wq.templateParams,
        wq.media
      );

      if (result) sent.push(wq._id);
      else {
        await WhatsAppQ.updateOne(
          { _id: wq._id },
          { $set: { sending: false } }
        );
      }
    }
  }

  await WhatsAppQ.deleteMany({ _id: sent });
};

module.exports = {
  serviceDbBackup,
  serviceClearHistory,
  serviceResetAlternateBus,
  serviceResetTempBusDevice,
  serviceResetCurrAcademicYear,
  // serviceInsertData,
  serviceCalculateOverdueAndApplyFine,
  serviceEmailQueue,
  servicePushQueue,
  serviceWhatsappQueue,
};
