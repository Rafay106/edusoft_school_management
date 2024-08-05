const School = require("../models/system/schoolModel");
const Student = require("../models/studentInfo/studentModel");
const Bus = require("../models/transport/busModel");
const StuBusAtt = require("../models/attendance/studentBusAttendanceModel");
const C = require("../constants");
const UC = require("../utils/common");
const Device = require("../models/system/deviceModel");
const { sendPushQueue } = require("../tools/push");
const StuClassAtt = require("../models/attendance/studentClassAttendanceModel");
const StudentNotification = require("../models/studentInfo/studentNotificationModel");
const User = require("../models/system/userModel");
const PushNotification = require("../models/system/pushNotificationModel");

const studentBusAttendance = async (loc) => {
  console.log("*****checkStuBusAttendance() START*****");

  UC.writeLog(
    "attendance",
    `dt_tracker: ${loc.dt_tracker.toISOString()} | imei: ${loc.imei} | io78: ${loc.params["io78"]}`
  );

  try {
    const device = await Device.findOne({ imei: loc.imei }).lean();

    if (!device) {
      const data = `Error: Device not found | IMEI: ${loc.imei}`;
      UC.writeLog("attendance_bus_students", data);
      return false;
    }

    const student = await Student.findOne({ rfid: loc.params.io78 })
      .select({
        admission_no: 1,
        name: 1,
        email: 1,
        phone: 1,
        bus_pick: 1,
        bus_drop: 1,
        bus_stop: 1,
        parent: 1,
        school: 1,
      })
      .populate("bus_stop", "name lat lon")
      .populate("class section", "name")
      .populate("bus_pick bus_drop", "name alternate temp_device")
      .lean();

    if (!student) {
      const data = `Error: Student not found | RFID: ${loc.params.io78}`;
      UC.writeLog("attendance_bus_students", data);
      return false;
    }

    if (!student.bus_pick) {
      const data = `Error: Student bus_pick not set | RFID: ${loc.params.io78}`;
      UC.writeLog("attendance_bus_students", data);
      return false;
    }

    if (!student.bus_drop) {
      const data = `Error: Student bus_drop not set | RFID: ${loc.params.io78}`;
      UC.writeLog("attendance_bus_students", data);
      return false;
    }

    const school = await School.findOne({ _id: student.school })
      .select("name lat lon radius address morning_attendance_end")
      .lean();

    if (!school) {
      const data = `Error: School not found | school: ${student.school}`;
      UC.writeLog("attendance_bus_students", data);
      return false;
    }

    const currBus = await Bus.findOne({ device: device._id })
      .select("name status device stop")
      .populate("stops", "name address lat lon")
      .populate("device")
      .lean();

    if (!currBus) {
      const data = `Error: Bus not found | Device: ${device.imei}`;
      UC.writeLog("attendance_bus_students", data);
      return false;
    }

    await Student.updateOne(
      { _id: student._id },
      { $set: { current_bus: currBus._id } }
    );

    // let busToFetch;
    let assignedBusId = student.bus_drop._id;

    if (isMorningTime(loc.dt_tracker, school.morning_attendance_end)) {
      //   if (student.bus_pick?.temp_device?.enabled) {
      //     busToFetch = student.bus_pick?.temp_device?.bus;
      //   } else busToFetch = student.bus_pick._id;

      assignedBusId = student.bus_pick._id;
    } // else {
    //   if (student.bus_drop?.temp_device?.enabled) {
    //     busToFetch = student.bus_drop?.temp_device?.bus;
    //   } else busToFetch = student.bus_drop._id;
    // }

    // if (!currBus._id.equals(busToFetch)) {
    //   busToFetch = currBus._id;
    //   await switchBus(busToFetch, currBus._id);
    // }

    // const bus = await Bus.findById(busToFetch)
    //   .select("name status device stop")
    //   .populate({ path: "stops", select: "name address lat lon" })
    //   .populate("device")
    //   .lean();

    // if (!bus) {
    //   const data = `Error: Bus not found | _id: ${busToFetch}`;
    //   UC.writeLog("attendance_bus_students", data);
    //   return false;
    // }

    if (!currBus._id.equals(assignedBusId)) {
      const assignedBus = await Bus.findOne(assignedBusId)
        .select("stops")
        .populate("stops", "name address lat lon")
        .lean();

      if (assignedBus) currBus.stops = assignedBus.stops;
    }

    loc.today = new Date(loc.dt_tracker).setUTCHours(0, 0, 0, 0);

    UC.writeLog(
      "attendance_bus_students",
      `Student: ${student.admission_no} | Bus: ${currBus.name}`
    );

    UC.writeLog(
      "attendance",
      `IMEI: ${loc.imei} | RFID: ${loc.params.io78} | Student: ${student.admission_no} | Bus: ${currBus.name}`
    );

    let isTaken = false;

    // Check morning attendance
    isTaken = await checkMorningBusAttendance(loc, student, school, currBus);
    if (isTaken) return true;

    // Check afternoon attendance
    isTaken = await checkAfternoonBusAttendance(loc, student, school, currBus);
    if (isTaken) return true;

    return isTaken;
  } catch (err) {
    console.log(err);
    UC.writeLog(
      "attendance_bus_students",
      `${err.message}: ${JSON.stringify(err.stack)}`
    );
  }

  console.log("*****checkStuBusAttendance() END*****");
};

const checkMorningBusAttendance = async (loc, student, school, bus) => {
  if (!isMorningTime(loc.dt_tracker, school.morning_attendance_end)) {
    return false;
  }

  // Check if attendance already taken
  // let isMEntryTaken = false;
  // let isMExitTaken = false;

  // Today's attendance
  // const TA = await StuBusAtt.findOne({ date: loc.today, student: student._id })
  //   .select("list")
  //   .lean();

  // if (TA) {
  //   if (TA.list.find((ele) => ele.tag === C.M_ENTRY)) isMEntryTaken = true;
  //   if (TA.list.find((ele) => ele.tag === C.M_EXIT)) isMExitTaken = true;
  // }

  // if rfid came from school then student reached school
  const skul = school;
  if (UC.isPointInCircle(loc.lat, loc.lon, skul.lat, skul.lon, skul.radius)) {
    await takeBusAttendance(loc, student, bus, C.M_EXIT, school);
    return true;
    // if (!isMExitTaken) {
    //   await takeBusAttendance(loc, student, C.M_EXIT, school);
    //   return true;
    // } else return false;
  }

  // if (isMEntryTaken) return false;

  const bs = student.bus_stop;
  const radius = process.env.BUS_STOP_RADIUS;

  // if rfid came from student bus_stop then student boarded bus for school
  if (UC.isPointInCircle(loc.lat, loc.lon, bs.lat, bs.lon, radius)) {
    await takeBusAttendance(loc, student, bus, C.M_ENTRY, school, bs);
    return true;
  }

  // if not then check for remaining stops
  for (const stop of bus.stops) {
    if (UC.isPointInCircle(loc.lat, loc.lon, stop.lat, stop.lon, radius)) {
      await takeBusAttendance(loc, student, bus, C.M_ENTRY, school, stop);
      return true;
    }
  }

  // if not then morning attendance came from location except stops and school
  await takeBusAttendance(loc, student, bus, C.M_ENTRY, school);
  return true;
};

const checkAfternoonBusAttendance = async (loc, student, school, bus) => {
  if (isMorningTime(loc.dt_tracker, school.morning_attendance_end)) {
    return false;
  }

  // Check if attendance already taken
  // let isAEntryTaken = false;
  // let isAExitTaken = false;

  // Today's attendance
  // const TA = await StuBusAtt.findOne({ date: loc.today, student: student._id })
  //   .select("list")
  //   .lean();

  // if (TA) {
  //   if (TA.list.find((ele) => ele.tag === C.A_ENTRY)) isAEntryTaken = true;
  //   if (TA.list.find((ele) => ele.tag === C.A_EXIT)) isAExitTaken = true;
  // }

  // if rfid came from school then student entered bus at school
  const skul = school;
  if (UC.isPointInCircle(loc.lat, loc.lon, skul.lat, skul.lon, skul.radius)) {
    await takeBusAttendance(loc, student, bus, C.A_ENTRY, school);
    return true;
    // if (!isAEntryTaken) {
    //   await takeBusAttendance(loc, student, bus, C.A_ENTRY, school);
    //   return true;
    // } else return false;
  }

  // if (isAExitTaken) return false;

  const bs = student.bus_stop;
  const radius = process.env.BUS_STOP_RADIUS;

  // if rfid came from student bus_stop then student dropped at bus stop
  if (UC.isPointInCircle(loc.lat, loc.lon, bs.lat, bs.lon, radius)) {
    await takeBusAttendance(loc, student, bus, C.A_EXIT, school, bs);
    return true;
  }

  // if not then check for remaining stops
  for (const stop of bus.stops) {
    if (UC.isPointInCircle(loc.lat, loc.lon, stop.lat, stop.lon, radius)) {
      await takeBusAttendance(loc, student, bus, C.A_EXIT, school, stop);
      return true;
    }
  }

  // if not then morning attendance came from location except stops and school
  await takeBusAttendance(loc, student, bus, C.A_EXIT, school);
  return true;
};

const studentClassAttendance = async (loc) => {
  UC.writeLog(
    "attendance",
    `dt_tracker: ${loc.dt_tracker.toISOString()} | imei: ${loc.imei} | io78: ${loc.params["io78"]}`
  );

  try {
    const student = await Student.findOne({ rfid: loc.params.io78 })
      .select({
        admission_no: 1,
        name: 1,
        email: 1,
        phone: 1,
        bus_pick: 1,
        bus_drop: 1,
        bus_stop: 1,
        parent: 1,
        school: 1,
      })
      .populate("class section", "name")
      .lean();

    if (!student) {
      const data = `Error: Student not found | RFID: ${loc.params.io78}`;
      UC.writeLog("attendance_class_students", data);
      return false;
    }

    const school = await School.findOne({ _id: student.school })
      .select("name lat lon radius address morning_attendance_end")
      .lean();

    if (!school) {
      const data = `Error: School not found | school: ${student.school}`;
      UC.writeLog("attendance_class_students", data);
      return false;
    }

    UC.writeLog(
      "attendance_class_students",
      `Student: ${student.admission_no}`
    );

    UC.writeLog(
      "attendance",
      `IMEI: ${loc.imei} | RFID: ${loc.params.io78} | Student: ${student.admission_no}`
    );

    loc.today = new Date(loc.dt_tracker).setUTCHours(0, 0, 0, 0);

    let isTaken = false;

    isTaken = await checkClassMorningAttendance(loc, student, school);
    if (isTaken) return true;

    isTaken = await checkClassAfternoonAttendance(loc, student, school);

    return isTaken;
  } catch (err) {
    console.log(err);
    UC.writeLog(
      "attendance_class_students",
      `${err.message}: ${JSON.stringify(err.stack)}`
    );
  }
};

const checkClassMorningAttendance = async (loc, student, school) => {
  if (!isMorningTime(loc.dt_tracker, school.morning_attendance_end)) {
    return false;
  }

  // Today's attendance
  const TA = await StuClassAtt.findOne({
    date: loc.today,
    student: student._id,
  })
    .select("list")
    .lean();

  // If Today's class entry attendance already taken then return true
  if (TA) {
    if (TA.list.find((ele) => ele.tag === C.ENTRY)) return true;
  }

  // If not then take class entry attendance
  await takeClassAttendance(loc, student, school, C.ENTRY);

  return true;
};

const checkClassAfternoonAttendance = async (loc, student, school) => {
  if (isMorningTime(loc.dt_tracker, school.morning_attendance_end)) {
    return false;
  }

  // Today's attendance
  const TA = await StuClassAtt.findOne({
    date: loc.today,
    student: student._id,
  })
    .select("list")
    .lean();

  // If Today's class entry attendance already taken then return true
  if (TA) {
    if (TA.list.find((ele) => ele.tag === C.EXIT)) return true;
  }

  // If not then take class entry attendance
  await takeClassAttendance(loc, student, school, C.EXIT);

  return true;
};

const isMorningTime = (currDT, morningTime) => {
  currDT = new Date(currDT);
  morningTime = morningTime.split(":").map((e) => parseInt(e));

  if (currDT.getUTCHours() < morningTime[0]) return true;
  else if (currDT.getUTCHours() === morningTime[0]) {
    if (currDT.getUTCMinutes() <= morningTime[1]) return true;
  }

  return false;
};

const takeBusAttendance = async (
  loc,
  student,
  bus,
  tag,
  school,
  location = false
) => {
  // const device = await Device.findOne({ imei: loc.imei }).lean();

  // // Current bus
  // const cBus = await Bus.findOne({ device: device._id })
  //   .select("_id name")
  //   .lean();

  const sName = student.name;
  const class_ = student.class.name;
  const section = student.section.name;
  const admNo = student.admission_no;
  const dt = UC.formatDateTimeToAMPM(UC.convUTCTo0530(loc.dt_tracker));

  let msg = `Your child ${sName} (${class_}-${section} ${admNo})`;
  let busMsg = "";
  let stopMsg = "";

  // Make bus message
  let defaultBus;

  if (isMorningTime(loc.dt_tracker, school.morning_attendance_end)) {
    if (student.bus_pick?.temp_device?.enabled) {
      const tempBus = await Bus.findById(student.bus_pick?.temp_device?.bus)
        .select("name alternate")
        .lean();

      defaultBus = tempBus;
    } else defaultBus = student.bus_pick;
  } else {
    if (student.bus_drop?.temp_device?.enabled) {
      const tempBus = await Bus.findById(student.bus_drop?.temp_device?.bus)
        .select("name alternate")
        .lean();

      defaultBus = tempBus;
    } else defaultBus = student.bus_drop;
  }

  if (!bus._id.equals(defaultBus._id)) {
    busMsg = `bus: ${bus.name} instead of bus: ${defaultBus.name}`;

    // const alt = defaultBus.alternate;
    // if (alt.enabled) {
    //   if (!bus._id.equals(alt.bus)) {
    //     const altBus = await Bus.findById(alt.bus).select("name").lean();
    //     // Wrong bus
    //     busMsg = `${bus.name} instead of ${altBus.name}`;
    //   } else {
    //     // Correct Alternate bus
    //     busMsg = `different bus (${bus.name}) today`;
    //   }
    // } else {
    //   // Wrong bus
    //   busMsg = `${bus.name} instead of ${defaultBus.name}`;
    // }
  } else busMsg = `bus: ${bus.name}`;

  // Make stop message
  const stuBusStop = student.bus_stop;
  if (!location) {
    stopMsg = `unknown stop (${loc.lat}, ${loc.lon}) instead of ${stuBusStop.name}`;
  } else {
    if (!stuBusStop._id.equals(location._id)) {
      stopMsg = `${location.name} instead of ${stuBusStop.name}`;
    } else stopMsg = `${location.name}`;
  }

  if (tag === C.M_ENTRY) {
    msg += ` has entered ${busMsg} from ${stopMsg}`;
  } else if (tag === C.M_EXIT) {
    msg += ` has arrived ${school.name} from ${busMsg}`;
    location = school;
  } else if (tag === C.A_ENTRY) {
    msg += ` has departed ${school.name} from ${busMsg}`;
    location = school;
  } else if (tag === C.A_EXIT) {
    msg += ` has exited ${busMsg} on ${stopMsg}`;
  }

  msg += ` at ${dt}`;

  UC.writeLog(
    "attendance_bus_students",
    `Attendance: ${student.admission_no} | ${bus.name} | ${tag} | ${
      location?.name || "NA"
    }`
  );

  const attendanceDetail = {
    tag,
    time: loc.dt_tracker,
    lat: loc.lat,
    lon: loc.lon,
    address: location.name || "unknown",
    msg,
    bus: bus._id,
  };

  // Today's attendance
  const TA = await StuBusAtt.findOne({ date: loc.today, student: student._id })
    .select("list")
    .lean();

  if (!TA) {
    const attendance = await StuBusAtt.create({
      date: loc.today,
      student: student._id,
      list: [attendanceDetail],
    });
  } else {
    const updateQuery = { date: loc.today, student: student._id };
    const tagData = {
      "list.$.time": loc.dt_tracker,
      "list.$.lat": loc.lat,
      "list.$.lon": loc.lon,
      "list.$.address": location.name || "unknown",
      "list.$.msg": msg,
      "list.$.bus": bus._id,
    };

    // Update attendance tags if exists or push new tag

    if (TA.list.find((ele) => ele.tag === tag)) {
      updateQuery["list.tag"] = tag;
      await StuBusAtt.updateOne(updateQuery, { $set: tagData });
    } else {
      await StuBusAtt.updateOne(updateQuery, {
        $set: { bus: bus._id },
        $push: { list: attendanceDetail },
      });
    }
  }

  await StudentNotification.create({
    type: "attendance-bus",
    student: student._id,
    msg,
  });

  if (student.parent) {
    await sendPushQueue(
      [student.parent],
      C.ATTENDANCE_BUS,
      `${school.name} Attendance`,
      msg
    );
  }
};

const takeClassAttendance = async (loc, student, school, tag) => {
  const sName = student.name;
  const class_ = student.class?.name || "NA";
  const section = student.section?.name || "NA";
  const admNo = student.admission_no;
  const dt = UC.formatDateTimeToAMPM(UC.convUTCTo0530(loc.dt_tracker));

  let msg = `Your child ${sName} (${class_}-${section} ${admNo})`;

  if (tag === C.ENTRY) msg += ` has checked-in school at ${dt}`;
  else if (tag === C.EXIT) msg += ` has checked-out school at ${dt}`;

  const attendanceDetail = {
    tag,
    time: loc.dt_tracker,
    msg,
  };

  if (!(await StuClassAtt.any({ date: loc.today, student: student._id }))) {
    const attendance = await StuClassAtt.create({
      date: loc.today,
      student: student._id,
      list: [attendanceDetail],
    });
  } else {
    const result = await StuClassAtt.updateOne(
      { date: loc.today, student: student._id },
      { $push: { list: attendanceDetail } }
    );
  }

  UC.writeLog(
    "attendance_class_students",
    `Student: ${student.admission_no} | msg: ${msg}`
  );

  await StudentNotification.create({
    type: "attendance-class",
    student: student._id,
    msg,
  });

  if (student.parent) {
    await sendPushQueue(
      [student.parent],
      C.ATTENDANCE_CLASS,
      `${school.name} Attendance`,
      msg
    );
  }
};

const switchBus = async (oldBusId, newBusId) => {
  await Bus.updateOne(
    { _id: oldBusId },
    { $set: { alternate: { enabled: true, bus: newBusId } } }
  );
};

module.exports = {
  studentBusAttendance,
  studentClassAttendance,
  isMorningTime,
};
