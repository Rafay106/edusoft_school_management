const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const User = require("../models/system/userModel");
const Student = require("../models/studentInfo/studentModel");
const StuBusAtt = require("../models/attendance/stuBusAttModel");
const StuAttEvent = require("../models/attendance/stuAttEventModel");
const Bus = require("../models/transport/busModel");
const School = require("../models/system/schoolModel");
const { isAfternoonTime } = require("../services/attendance");

// @desc    Get parent info
// @route   POST /api/parent/account-info
// @access  Private
const getParentAccountInfo = asyncHandler(async (req, res) => {
  const parent = await User.findById(req.user._id)
    .select("-password")
    .populate("school", "name")
    .lean();

  if (!parent) {
    res.status(400);
    throw new Error(C.getResourse404Id("User", req.user._id));
  }

  const students = await Student.find({ parent: parent._id })
    .select("admission_no name email")
    .lean();

  res.status(200).json({ ...parent, children: students });
});

// @desc    Assign parent to student
// @route   POST /api/parent/add-student
// @access  Private
const addStudent = asyncHandler(async (req, res) => {
  const manager = req.user.manager;
  const school = req.user.school;
  const admNo = req.body.adm_no;

  const query = { admission_no: admNo, manager, school };

  if (!(await Student.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Id("Student", admNo));
  }

  const result = await Student.updateOne(query, {
    $set: { parent: req.user._id },
  });

  res.json(result);
});

// @desc    Get bus locations
// @route   POST /api/parent/bus/track
// @access  Private
const trackBus = asyncHandler(async (req, res) => {
  const school = req.user.school;
  const busId = req.body.bus;

  const results = [];

  if (busId) {
    const bus = await Bus.findById(busId)
      .select("name no_plate status device")
      .lean();

    return res.status(200).json([
      {
        busName: bus.name,
        no_plate: bus.no_plate,
        status: bus.status,
        imei: bus.device.imei,
        dt_server: bus.device.dt_server,
        dt_tracker: bus.device.dt_tracker.toISOString(),
        lat: bus.device.lat,
        lon: bus.device.lon,
        speed: bus.device.speed,
        altitude: bus.device.altitude,
        angle: bus.device.angle,
        vehicle_status: bus.device.vehicle_status,
        ignition: bus.device.params.io239 === "1",
      },
    ]);
  }

  const students = await Student.find({ parent: req.user._id, school })
    .select("_id admission_no name bus_pick bus_drop")
    .populate("bus_pick bus_drop", "alternate")
    .lean();

  for (const stu of students) {
    let stuBus = stu.bus_pick;
    if (isAfternoonTime(new Date(), school.timings.afternoon)) {
      stuBus = stu.bus_drop;
    }

    if (!stuBus) {
      results.push({
        student: {
          admission_no: stu.admission_no,
          name: stu.name,
        },
        msg: "Pedestrian",
      });

      continue;
    }

    const busToFetch = stuBus.alternate.enabled
      ? stuBus.alternate.bus
      : stuBus._id;

    const bus = await Bus.findById(busToFetch)
      .select("name no_plate status device")
      .lean();

    results.push({
      student: {
        admission_no: stu.admission_no,
        name: stu.name,
      },
      busName: bus.name,
      no_plate: bus.no_plate,
      status: bus.status,
      imei: bus.device.imei,
      dt_server: bus.device.dt_server,
      dt_tracker: bus.device.dt_tracker,
      lat: bus.device.lat,
      lon: bus.device.lon,
      speed: bus.device.speed,
      altitude: bus.device.altitude,
      angle: bus.device.angle,
      vehicle_status: bus.device.vehicle_status,
      ignition: bus.device.params.io239 === "1",
      icon: UC.getBusIcon(bus.device),
    });
  }

  res.status(200).json(results);
});

// @desc    Get student's attendance
// @route   POST /api/parent/student/attendance
// @access  Private
const getStudentAttendance = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "admission_no";
  const search = req.query.search;
  const manager = req.user.manager;
  const school = req.user.school;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");

  const students = await Student.find({ parent: req.user._id, manager, school })
    .select("_id admission_no name")
    .lean();

  const query = {
    date: { $gte: dtStart, $lte: dtEnd },
    student: students.map((s) => s._id),
  };

  if (search) {
    const fields = [
      "admission_no",
      "name",
      "email",
      "address.permanent",
      "address.correspondence",
    ];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    StuBusAtt,
    query,
    {},
    page,
    limit,
    sort,
    ["student bus", "admission_no name"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  for (const result of results.result) {
    result.student = {
      admission_no: result.student.admission_no,
      name: result.student.name,
    };

    for (const list of result.list) {
      if (list.tag === C.M_ENTRY) list.tag = "Picked from Stoppage";
      else if (list.tag === C.M_EXIT) list.tag = "Dropped at School";
      else if (list.tag === C.A_ENTRY) list.tag = "Picked from School";
      else if (list.tag === C.A_EXIT) list.tag = "Dropped at Stoppage";
    }
  }

  res.status(200).json(results);
});

// @desc    Get student's attendance count
// @route   POST /api/parent/student/attendance-count
// @access  Private
const getStudentAttendanceCount = asyncHandler(async (req, res) => {
  const manager = req.user.manager;
  const school = req.user.school;

  const noOfHolidays = req.body.no_of_holidays;

  // Validate dt_start
  if (!req.body.dt_start) {
    res.status(400);
    throw new Error(C.getFieldIsReq("dt_start"));
  }
  const dtStart = new Date(req.body.dt_start);
  if (isNaN(dtStart)) {
    res.status(400);
    throw new Error(C.getFieldIsInvalid("dt_start"));
  }
  dtStart.setUTCHours(0, 0, 0, 0);

  // Validate dt_end
  if (!req.body.dt_end) {
    res.status(400);
    throw new Error(C.getFieldIsReq("dt_end"));
  }
  const dtEnd = new Date(req.body.dt_end);
  if (isNaN(dtEnd)) {
    res.status(400);
    throw new Error(C.getFieldIsInvalid("dtEnd"));
  }
  dtEnd.setUTCHours(0, 0, 0, 0);

  // Validate no_of_holidays
  if (!noOfHolidays && noOfHolidays !== 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("no_of_holidays"));
  }

  if (isNaN(parseInt(noOfHolidays))) {
    res.status(400);
    throw new Error(C.getFieldIsInvalid("no_of_holidays"));
  }

  const dates = [];
  let cDate = new Date(dtStart);
  while (cDate <= dtEnd) {
    dates.push(cDate);
    cDate = new Date(cDate.getTime() + 86400000);
  }

  const students = await Student.find({ parent: req.user._id, manager, school })
    .select("_id admission_no name photo")
    .lean();

  const result = [];

  for (const stu of students) {
    const count = { t: 0, p: 0, a: 0 };
    for (const date of dates) {
      const attendance = await StuBusAtt.findOne({ date, student: stu._id })
        .populate("student", "admission_no")
        .lean();

      if (!attendance) count.a += 1;
      else count.p += 1;
      count.t += 1;
    }

    count.a = count.a - noOfHolidays;
    count.t = count.t - noOfHolidays;

    result.push({
      admission_no: stu.admission_no,
      name: stu.name,
      photo: stu.photo || "/user-blank.svg",
      ...count,
    });
  }

  res.status(200).json(result);
});

// @desc    Get student's attendance notification
// @route   POST /api/parent/student/attendance-notification
// @access  Private
const getStudentAttendanceNotification = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "admission_no";
  const search = req.query.search;

  const manager = req.user.manager;
  const school = req.user.school;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");

  const students = await Student.find({ parent: req.user._id, manager, school })
    .select("_id admission_no name")
    .lean();

  const query = {
    date: { $gte: dtStart, $lte: dtEnd },
    student: students.map((s) => s._id),
    // sent: true,
  };

  if (search) {
    const fields = [
      "admission_no",
      "name",
      "email",
      "address.current",
      "address.permanent",
    ];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    StuAttEvent,
    query,
    {},
    page,
    limit,
    sort,
    ["student bus", "admission_no name"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  for (const result of results.result) {
    result.student = {
      admission_no: result.student.admission_no,
      name: result.student.name,
    };

    result.bus = result.bus.name;
  }

  res.status(200).json(results);
});

// @desc    Get student's bus contact info
// @route   POST /api/parent/student/bus-contact-info
// @access  Private
const getStudentBusContactInfo = asyncHandler(async (req, res) => {
  const manager = req.user.manager;
  const school = req.user.school;

  const students = await Student.find({ parent: req.user._id, manager, school })
    .select("_id admission_no name bus_pick bus_drop")
    .populate("bus_pick bus_drop", "alternate")
    .lean();

  const results = [];

  for (const s of students) {
    let stuBus = s.bus_pick;
    if (isAfternoonTime(new Date(), school.timings.afternoon)) {
      stuBus = s.bus_drop;
    }

    let busToFetch = stuBus.alternate.enabled
      ? stuBus.alternate.bus
      : stuBus._id;

    const bus = await Bus.findById(busToFetch)
      .select("name driver conductor")
      .populate("driver conductor", "name email phone")
      .lean();

    results.push({
      student: { admission_no: s.admission_no, name: s.name },
      bus: bus.name,
      bus_incharge: school?.bus_incharge,
      driver: {
        name: bus.driver.name,
        email: bus.driver.email,
        phone: bus.driver.phone,
      },
      conductor: {
        name: bus.conductor.name,
        email: bus.conductor.email,
        phone: bus.conductor.phone,
      },
    });
  }

  res.status(200).json(results);
});

// @desc    Get attendance calendar
// @route   POST /api/parent/student/attendance-calendar
// @access  Private
const getStudentAttendanceCalendar = asyncHandler(async (req, res) => {
  const studentId = req.body.student;

  if (!studentId) {
    res.status(400);
    throw new Error(C.getFieldIsReq("student"));
  }

  if (!(await Student.any({ _id: studentId, parent: req.user._id }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("student", studentId));
  }

  if (!req.body.month) {
    res.status(400);
    throw new Error(C.getFieldIsReq("month"));
  }

  const month = parseInt(req.body.month);

  if (isNaN(month)) {
    res.status(400);
    throw new Error(C.getFieldIsInvalid("month"));
  }

  const now = new Date(new Date().setUTCHours(0, 0, 0, 0));
  const dtStart = new Date(new Date(now.setMonth(month - 1)).setDate(1));
  const dtEnd = new Date(new Date(now.setMonth(month)).setDate(0));

  const student = await Student.findById(studentId)
    .select("_id admission_no name")
    .lean();

  const query = {
    date: { $gte: dtStart, $lte: dtEnd },
    student: student._id,
  };

  const attendances = await StuBusAtt.find(query).lean();

  const result = [];
  const lastDate = dtEnd.getUTCDate();

  const week = [];
  for (let d = 1; d <= lastDate; d++) {
    const currDate = new Date(new Date(dtStart).setUTCDate(d));

    const att = attendances.find(
      (att) => att.date.getTime() === currDate.getTime()
    );

    if (att) {
      week.push({ date: currDate, attendance: "Present" });
    } else week.push({ date: currDate, attendance: "Absent" });

    if (d % 7 === 0) {
      const week_ = [...week];
      result.push(week_);
      week.splice(0, week.length);
    }
  }

  if (week.length > 0) result.push(week);

  res.status(200).json(result);
});

module.exports = {
  getParentAccountInfo,
  addStudent,
  trackBus,
  getStudentAttendance,
  getStudentAttendanceCount,
  getStudentAttendanceNotification,
  getStudentBusContactInfo,
  getStudentAttendanceCalendar,
};
