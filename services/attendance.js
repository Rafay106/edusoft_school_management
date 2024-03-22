const StuBusAtt = require("../models/attendance/stuBusAttModel");
const Bus = require("../models/transport/busModel");
const Student = require("../models/academics/studentModel");
const C = require("../constants");
const {
  isPointInCircle,
  convUTCTo0530,
  getStudentName,
  formatDateToAMPM,
  writeLog,
} = require("../utils/common");

const { notifyPushQueue } = require("../tools/notifyPush");
const School = require("../models/system/schoolModel");
const BusStop = require("../models/transport/busStopModel");

const checkStuBusAttendance = async (loc) => {
  try {
    const student = await Student.findOne({ rfid: loc.params.io78 })
      .select({
        admissionNo: 1,
        name: 1,
        email: 1,
        phone: 1,
        bus: 1,
        busStops: 1,
        manager: 1,
        school: 1,
      })
      .populate({ path: "bus", select: "_id name status alternate" })
      .lean();

    if (!student) return false;

    const bus = await Bus.findById(student.bus)
      .select("name status alternate device stop")
      .populate({ path: "stops", select: "address lat lon fees" })
      .lean();

    if (!bus) {
      const data = `Error: Bus (${student.bus}) not found | RFID: ${loc.params.io78}`;
      writeLog("attendance_student_bus", data);
      return false;
    }

    const school = await School.findById(student.school)
      .select("lat lon radius address timings")
      .lean();

    if (!school) {
      const data = `Error: School (${student.school}) not found | RFID: ${loc.params.io78}`;
      writeLog("attendance_student_bus", data);
      return false;
    }

    // 1. Check if attendance already taken
    let isMEntryTaken = false;
    let isMExitTaken = false;
    let isAEntryTaken = false;
    let isAExitTaken = false;

    loc.today = new Date(loc.dt_tracker).setUTCHours(0, 0, 0, 0);
    // Today's attendance
    const TA = await StuBusAtt.findOne({
      date: loc.today,
      student: student._id,
    })
      .select("list")
      .lean();

    if (TA) {
      const list = TA.list;

      if (list.find((ele) => ele.tag === C.M_ENTRY)) isMEntryTaken = true;
      if (list.find((ele) => ele.tag === C.M_EXIT)) isMExitTaken = true;
      if (list.find((ele) => ele.tag === C.A_ENTRY)) isAEntryTaken = true;
      if (list.find((ele) => ele.tag === C.A_EXIT)) isAExitTaken = true;
    }

    if (!isMEntryTaken) {
      // 1. Check for bus boarding attendance (at bus-stop location)
      await checkMorningEntryAttendance(loc, student, school, bus);
    } else if (!isMExitTaken) {
      // 2. Check for bus deboarding attendance (at school's location)
      await checkMorningExitAttendance(loc, student, school);
    } else if (!isAEntryTaken) {
      // 3. Check for bus boarding attendance (at school's location)
      await checkAfternoonEntryAttendance(loc, student, school);
    } else if (!isAExitTaken) {
      // 4. Check for bus deboarding attendance (at bus-stop location)
      await checkAfternoonExitAttendance(loc, student, school, bus);
    }
  } catch (err) {
    console.log(err);
  }
};

const checkMorningEntryAttendance = async (loc, student, school, bus) => {
  const morningTime = school.timings.morning;

  if (!isMorningTime(loc.dt_tracker, morningTime)) return false;

  const busStops = bus.stops;
  if (!busStops || busStops.length == 0) {
    await takeAttendance(loc, student, C.UNKNOWN, "NA", 0);
    return true;
  }

  for (const bs of busStops) {
    if (isPointInCircle(loc.lat, loc.lon, bs.lat, bs.lon, bs.radius)) {
      await takeAttendance(loc, student, C.M_ENTRY, bs.address, bs.fees);
      return true;
    }
  }

  return false;
};

const checkMorningExitAttendance = async (loc, student, school) => {
  const morningTime = school.timings.morning;

  if (!isMorningTime(loc.dt_tracker, morningTime)) return false;

  const skul = student.school;

  if (isPointInCircle(loc.lat, loc.lon, skul.lat, skul.lon, skul.radius)) {
    await takeAttendance(loc, student, C.M_EXIT, skul.address);
    return true;
  }

  return false;
};

const checkAfternoonEntryAttendance = async (loc, student, school) => {
  const afternoonTime = school.timings.afternoon;

  if (!isAfternoonTime(loc.dt_tracker, afternoonTime)) return false;

  const skul = student.school;

  if (isPointInCircle(loc.lat, loc.lon, skul.lat, skul.lon, skul.radius)) {
    await takeAttendance(loc, student, C.A_ENTRY, skul.address);
    return true;
  }

  return false;
};

const checkAfternoonExitAttendance = async (loc, student, school, bus) => {
  const afternoonTime = school.timings.afternoon;

  if (!isAfternoonTime(loc.dt_tracker, afternoonTime)) return false;

  for (const pl of student.pickupLocations) {
    if (isPointInCircle(loc.lat, loc.lon, pl.lat, pl.lon, pl.radius)) {
      await takeAttendance(loc, student, C.A_EXIT, pl.address);
      return true;
    }
  }

  return false;
};

const isMorningTime = (currDT, morningTime) => {
  currDT = new Date(currDT);
  morningTime = morningTime.split(":").map((e) => parseInt(e));

  return (
    currDT.getUTCHours() < morningTime[0] &&
    currDT.getUTCMinutes() < morningTime[1]
  );
};

const isAfternoonTime = (currDT, afternoonTime) => {
  currDT = new Date(currDT);
  afternoonTime = afternoonTime.split(":").map((e) => parseInt(e));

  return (
    currDT.getUTCHours() < afternoonTime[0] &&
    currDT.getUTCMinutes() < afternoonTime[1]
  );
};

const takeAttendance = async (loc, student, tag, address, fees = 0) => {
  const bus = await Bus.findOne({ "device.imei": loc.imei })
    .select("_id name")
    .lean();

  const bus_stop_fee = {};
  if (tag === C.M_ENTRY) bus_stop_fee.pickup = fees;
  else if (tag === C.A_EXIT) bus_stop_fee.drop = fees;

  const attendanceDetail = {
    tag,
    time: loc.dt_tracker,
    lat: loc.lat,
    lon: loc.lon,
    address,
  };

  if (!(await StuBusAtt.any({ date: loc.today, student: student._id }))) {
    const attendance = await StuBusAtt.create({
      date: loc.today,
      bus_stop_fee,
      student: student._id,
      bus: bus._id,
      list: [attendanceDetail],
    });
  } else {
    const result = await StuBusAtt.updateOne(
      { date: loc.today, student: student._id },
      {
        $set: { bus_stop_fee, bus: bus._id },
        $push: { list: attendanceDetail },
      }
    );
  }

  const sName = getStudentName(student.name);
  const bName = bus.name;
  const dt = formatDateToAMPM(convUTCTo0530(loc.dt_tracker));
  let msg = "";

  if (tag === C.M_ENTRY) {
    msg = `[${dt}]: ${sName} has entered the bus ${bName} for school (${loc.lat}, ${loc.lon})`;

    // Different bus than assigned
    if (bus._id !== student.bus._id) {
      const altBus = await Bus.findById(student.bus.alternate)
        .select("name status")
        .lean();

      if (bus._id !== altBus) {
        msg = `[${dt}]: ${sName} has entered the wrong bus ${bName} for school (${loc.lat}, ${loc.lon})`;
      }
    }
  } else if (tag === C.M_EXIT) {
    msg = `[${dt}]: ${sName} has exited the bus ${bName} at school (${loc.lat}, ${loc.lon})`;
  } else if (tag === C.A_ENTRY) {
    msg = `[${dt}]: ${sName} has entered the bus ${bName} at school (${loc.lat}, ${loc.lon})`;

    // Different bus than assigned
    if (bus._id !== student.bus._id) {
      const altBus = await Bus.findById(student.bus.alternate)
        .select("name status")
        .lean();

      if (bus._id !== altBus) {
        msg = `[${dt}]: ${sName} has entered the wrong bus ${bName} at school (${loc.lat}, ${loc.lon})`;
      }
    }
  } else if (tag === C.A_EXIT) {
    msg = `[${dt}]: ${sName} has exited the bus ${bName} at pickup location (${loc.lat}, ${loc.lon})`;
  } else if (tag === C.UNKNOWN) {
    msg = `[${dt}]: Attendance taken of ${sName} from bus ${bName} at location (${loc.lat}, ${loc.lon})`;
  }

  await notifyPushQueue(msg, student._id);
};

module.exports = {
  checkStuBusAttendance,
};
