const StuBusAtt = require("../models/attendance/stuBusAttModel");
const Bus = require("../models/transport/busModel");
const Student = require("../models/studentInfo/studentModel");
const C = require("../constants");
const {
  isPointInCircle,
  convUTCTo0530,
  getPersonName,
  formatDateToAMPM,
  writeLog,
} = require("../utils/common");

const { storeStuAttNotification } = require("../tools/notifications");
const School = require("../models/system/schoolModel");
const BusStop = require("../models/transport/busStopModel");

const checkStuBusAttendance = async (loc) => {
  console.log("*****checkStuBusAttendance() START*****");

  try {
    const student = await Student.findOne({ rfid: loc.params.io78 })
      .select({
        admission_no: 1,
        name: 1,
        email: 1,
        phone: 1,
        bus: 1,
        bus_stop: 1,
        manager: 1,
        school: 1,
      })
      .populate("bus_stop")
      .populate("class section", "name")
      .populate("bus", "name alternate")
      .lean();

    if (!student) {
      const data = `Error: Student not found | RFID: ${loc.params.io78}`;
      writeLog("attendance_bus_students", data);
      return false;
    }

    const currBus = await Bus.findOne({ "device.imei": loc.imei })
      .select("_id")
      .lean();

    if (!currBus) {
      const data = `Error: Bus not found | IMEI: ${loc.imei}`;
      writeLog("attendance_bus_students", data);
      return false;
    }

    let busToFetch = student.bus._id;
    if (!currBus._id.equals(student.bus._id)) {
      busToFetch = currBus._id;
      await switchBus(student.bus._id, currBus._id);
    }

    const bus = await Bus.findById(busToFetch)
      .select("name status device stop")
      .populate({ path: "stops", select: "name address lat lon fees" })
      .lean();

    if (!bus) {
      const data = `Error: Bus not found | _id: ${busToFetch}`;
      writeLog("attendance_bus_students", data);
      return false;
    }

    const school = await School.findOne({ school: student.school })
      .select("name lat lon radius address timings")
      .lean();

    if (!school) {
      const data = `Error: School not found | school: ${student.school}`;
      writeLog("attendance_bus_students", data);
      return false;
    }

    loc.today = new Date(loc.dt_tracker).setUTCHours(0, 0, 0, 0);

    let isTaken = false;

    // Check morning attendance
    isTaken = await checkMorningAttendance(loc, student, school, bus);
    if (isTaken) return true;

    // Check afternoon attendance
    isTaken = await checkAfternoonAttendance(loc, student, school, bus);
    if (isTaken) return true;

    return isTaken;
  } catch (err) {
    console.log(err);
  }

  console.log("*****checkStuBusAttendance() END*****");
};

const checkMorningAttendance = async (loc, student, school, bus) => {
  const morningTime = school.timings.morning;

  if (!isMorningTime(loc.dt_tracker, morningTime)) return false;

  // Check if attendance already taken
  let isMEntryTaken = false;
  let isMExitTaken = false;

  // Today's attendance
  const TA = await StuBusAtt.findOne({ date: loc.today, student: student._id })
    .select("list")
    .lean();

  if (TA) {
    if (TA.list.find((ele) => ele.tag === C.M_ENTRY)) isMEntryTaken = true;
    if (TA.list.find((ele) => ele.tag === C.M_EXIT)) isMExitTaken = true;
  }

  // if rfid came from school then student reached school
  const skul = school;
  if (isPointInCircle(loc.lat, loc.lon, skul.lat, skul.lon, skul.radius)) {
    if (!isMExitTaken) {
      await takeAttendance(loc, student, C.M_EXIT, school);
      return true;
    } else return false;
  }

  if (isMEntryTaken) return false;

  const bs = student.bus_stop;
  const radius = process.env.BUS_STOP_RADIUS;

  // if rfid came from student bus_stop then student boarded bus for school
  if (isPointInCircle(loc.lat, loc.lon, bs.lat, bs.lon, radius)) {
    await takeAttendance(loc, student, C.M_ENTRY, bs);
    return true;
  }

  // if not then check for remaining stops
  for (const stop of bus.stops) {
    if (isPointInCircle(loc.lat, loc.lon, stop.lat, stop.lon, radius)) {
      await takeAttendance(loc, student, C.M_ENTRY, stop);
      return true;
    }
  }

  // if not then morning attendance came from location except stops and school
  await takeAttendance(loc, student, C.M_ENTRY);
  return true;
};

const checkAfternoonAttendance = async (loc, student, school, bus) => {
  const afternoonTime = school.timings.afternoon;

  if (!isAfternoonTime(loc.dt_tracker, afternoonTime)) return false;

  // Check if attendance already taken
  let isAEntryTaken = false;
  let isAExitTaken = false;

  // Today's attendance
  const TA = await StuBusAtt.findOne({ date: loc.today, student: student._id })
    .select("list")
    .lean();

  if (TA) {
    if (TA.list.find((ele) => ele.tag === C.A_ENTRY)) isAEntryTaken = true;
    if (TA.list.find((ele) => ele.tag === C.A_EXIT)) isAExitTaken = true;
  }

  // if rfid came from school then student entered bus at school
  const skul = school;
  if (isPointInCircle(loc.lat, loc.lon, skul.lat, skul.lon, skul.radius)) {
    if (!isAEntryTaken) {
      await takeAttendance(loc, student, C.A_ENTRY, school);
      return true;
    } else return false;
  }

  if (isAExitTaken) return false;

  const bs = student.bus_stop;
  const radius = process.env.BUS_STOP_RADIUS;

  // if rfid came from student bus_stop then student dropped at bus stop
  if (isPointInCircle(loc.lat, loc.lon, bs.lat, bs.lon, radius)) {
    await takeAttendance(loc, student, C.A_EXIT, bs);
    return true;
  }

  // if not then check for remaining stops
  for (const stop of bus.stops) {
    if (isPointInCircle(loc.lat, loc.lon, stop.lat, stop.lon, radius)) {
      await takeAttendance(loc, student, C.A_EXIT, stop);
      return true;
    }
  }

  // if not then morning attendance came from location except stops and school
  await takeAttendance(loc, student, C.A_EXIT);
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

const isAfternoonTime = (currDT, afternoonTime) => {
  currDT = new Date(currDT);
  afternoonTime = afternoonTime.split(":").map((e) => parseInt(e));

  if (currDT.getUTCHours() > afternoonTime[0]) return true;
  else if (currDT.getUTCHours() === afternoonTime[0]) {
    if (currDT.getUTCMinutes() >= afternoonTime[1]) return true;
  }

  return false;
};

const takeAttendance = async (loc, student, tag, location = false) => {
  const school = await School.findOne({ school: student.school })
    .select("name")
    .lean();

  // Current bus
  const cBus = await Bus.findOne({ "device.imei": loc.imei })
    .select("_id name")
    .lean();

  const sName = getPersonName(student.name);
  const class_ = student.class.name;
  const section = student.section.name;
  const admNo = student.admission_no;
  const dt = formatDateToAMPM(convUTCTo0530(loc.dt_tracker));

  let msg = `Your child ${sName} (class: ${class_}, section: ${section}, admission_no: ${admNo})`;
  let busMsg = "";
  let stopMsg = "";

  // Make bus message
  if (!cBus._id.equals(student.bus._id)) {
    const alt = student.bus.alternate;
    if (alt.enabled) {
      const altBus = await Bus.findById(alt.bus).select("name").lean();
      if (!cBus._id.equals(altBus._id)) {
        // Wrong bus
        busMsg = `bus (${cBus.name}) instead of bus (${altBus.name})`;
      } else {
        // Correct Alternate bus
        busMsg = `alternate bus (${cBus.name}) today`;
      }
    } else {
      // Wrong bus
      busMsg = `bus (${cBus.name}) instead of bus (${student.bus.name})`;
    }
  } else {
    // Correct bus
    busMsg = `bus (${cBus.name})`;
  }

  // Make stop message
  const stuBusStop = student.bus_stop;
  if (!location) {
    stopMsg = `unknown stop (${loc.lat}, ${loc.lon}) instead of stop (${stuBusStop.name})`;
  } else {
    if (!stuBusStop._id.equals(location._id)) {
      stopMsg = `stop (${location.name}) instead of stop (${stuBusStop.name})`;
    } else stopMsg = `stop (${location.name})`;
  }

  if (tag === C.M_ENTRY) {
    msg += ` has entered ${busMsg} from ${stopMsg}`;
  } else if (tag === C.M_EXIT) {
    msg += ` has arrived ${location.name} from ${busMsg}`;
  } else if (tag === C.A_ENTRY) {
    msg += ` has departed ${location.name} from ${busMsg}`;
  } else if (tag === C.A_EXIT) {
    msg += ` has exited ${busMsg} on ${stopMsg}`;
  }

  msg += ` at ${dt}`;

  const attendanceDetail = {
    tag,
    time: loc.dt_tracker,
    lat: loc.lat,
    lon: loc.lon,
    address: location.name || "unknown",
    msg,
  };

  if (!(await StuBusAtt.any({ date: loc.today, student: student._id }))) {
    const attendance = await StuBusAtt.create({
      date: loc.today,
      student: student._id,
      bus: cBus._id,
      list: [attendanceDetail],
    });
  } else {
    const result = await StuBusAtt.updateOne(
      { date: loc.today, student: student._id },
      {
        $set: { bus: cBus._id },
        $push: { list: attendanceDetail },
      }
    );
  }

  await storeStuAttNotification(msg, student._id, loc.today, cBus._id);
};

const switchBus = async (oldBusId, newBusId) => {
  await Bus.updateOne(
    { _id: oldBusId },
    { $set: { alternate: { enabled: true, bus: newBusId } } }
  );
};

module.exports = {
  checkStuBusAttendance,
};
