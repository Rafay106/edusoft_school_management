const School = require("../models/system/schoolModel");
const Student = require("../models/studentInfo/studentModel");
const Bus = require("../models/transport/busModel");
const StuBusAtt = require("../models/attendance/stuBusAttModel");
const StuAttEvent = require("../models/attendance/stuAttEventModel");
const PushQ = require("../models/queues/pushQueueModel");
const C = require("../constants");
const UC = require("../utils/common");
const {
  isPointInCircle,
  convUTCTo0530,
  formatDateToAMPM,
  writeLog,
} = require("../utils/common");

const checkStuBusAttendance = async (loc) => {
  console.log("*****checkStuBusAttendance() START*****");

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
        school: 1,
      })
      .populate("bus_stop")
      .populate("class section", "name")
      .populate("bus_pick bus_drop", "name alternate temp_device")
      .lean();

    if (!student) {
      const data = `Error: Student not found | RFID: ${loc.params.io78}`;
      writeLog("attendance_bus_students", data);
      return false;
    }

    const school = await School.findOne({ school: student.school })
      .select("name lat lon radius address morning_attendance_end")
      .lean();

    if (!school) {
      const data = `Error: School not found | school: ${student.school}`;
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

    let busToFetch;
    let assignedBus = student.bus_drop._id;

    if (isMorningTime(loc.dt_tracker, school.morning_attendance_end)) {
      if (student.bus_pick?.temp_device?.enabled) {
        busToFetch = student.bus_pick?.temp_device?.bus;
      } else busToFetch = student.bus_pick._id;

      assignedBus = student.bus_pick._id;
    } else {
      if (student.bus_drop?.temp_device?.enabled) {
        busToFetch = student.bus_drop?.temp_device?.bus;
      } else busToFetch = student.bus_drop._id;
    }

    if (!currBus._id.equals(busToFetch)) {
      busToFetch = currBus._id;
      await switchBus(busToFetch, currBus._id);
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

    if (!bus._id.equals(assignedBus)) {
      const assignedBus_ = await Bus.findOne(assignedBus)
        .select("stops")
        .populate({ path: "stops", select: "name address lat lon fees" });

      if (assignedBus_) bus.stops = assignedBus_.stops;
    }

    loc.today = new Date(loc.dt_tracker).setUTCHours(0, 0, 0, 0);

    UC.writeLog(
      "attendance.js",
      `Student: ${student.admission_no} | Bus: ${bus.name}`
    );

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
  if (!isMorningTime(loc.dt_tracker, school.morning_attendance_end)) {
    return false;
  }

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
    await takeAttendance(loc, student, C.M_ENTRY, school, bs);
    return true;
  }

  // if not then check for remaining stops
  for (const stop of bus.stops) {
    if (isPointInCircle(loc.lat, loc.lon, stop.lat, stop.lon, radius)) {
      await takeAttendance(loc, student, C.M_ENTRY, school, stop);
      return true;
    }
  }

  // if not then morning attendance came from location except stops and school
  await takeAttendance(loc, student, C.M_ENTRY, school);
  return true;
};

const checkAfternoonAttendance = async (loc, student, school, bus) => {
  if (isMorningTime(loc.dt_tracker, school.morning_attendance_end)) {
    return false;
  }

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
    await takeAttendance(loc, student, C.A_EXIT, school, bs);
    return true;
  }

  // if not then check for remaining stops
  for (const stop of bus.stops) {
    if (isPointInCircle(loc.lat, loc.lon, stop.lat, stop.lon, radius)) {
      await takeAttendance(loc, student, C.A_EXIT, school, stop);
      return true;
    }
  }

  // if not then morning attendance came from location except stops and school
  await takeAttendance(loc, student, C.A_EXIT, school);
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

const takeAttendance = async (loc, student, tag, school, location = false) => {
  // Current bus
  const cBus = await Bus.findOne({ "device.imei": loc.imei })
    .select("_id name")
    .lean();

  const sName = student.name;
  const class_ = student.class.name;
  const section = student.section.name;
  const admNo = student.admission_no;
  const dt = formatDateToAMPM(convUTCTo0530(loc.dt_tracker));

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

  if (!cBus._id.equals(defaultBus._id)) {
    const alt = defaultBus.alternate;
    if (alt.enabled) {
      if (!cBus._id.equals(alt.bus)) {
        const altBus = await Bus.findById(alt.bus).select("name").lean();
        // Wrong bus
        busMsg = `${cBus.name} instead of ${altBus.name}`;
      } else {
        // Correct Alternate bus
        busMsg = `different bus (${cBus.name}) today`;
      }
    } else {
      // Wrong bus
      busMsg = `${cBus.name} instead of ${defaultBus.name}`;
    }
  } else {
    // Correct bus
    busMsg = `${cBus.name}`;
  }

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

  await StuAttEvent.create({
    msg,
    date: loc.today,
    student: student._id,
    bus: cBus._id,
  });

  await PushQ.create({ msg, receivers: [student._id, student.school] });
};

const switchBus = async (oldBusId, newBusId) => {
  await Bus.updateOne(
    { _id: oldBusId },
    { $set: { alternate: { enabled: true, bus: newBusId } } }
  );
};

module.exports = {
  checkStuBusAttendance,
  isMorningTime,
};
