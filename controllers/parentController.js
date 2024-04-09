const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const User = require("../models/system/userModel");
const Student = require("../models/studentInfo/studentModel");
const StuBusAtt = require("../models/attendance/stuBusAttModel");
const StuAttEvent = require("../models/attendance/stuAttEventModel");
const Bus = require("../models/transport/busModel");
const School = require("../models/system/schoolModel");

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
    throw new Error(C.getResourse404Error("User", req.user._id));
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
    throw new Error(C.getResourse404Error("Student", admNo));
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
  const manager = req.user.manager;
  const school = req.user.school;

  const results = [];

  const students = await Student.find({ parent: req.user._id, manager, school })
    .select("_id admission_no name bus")
    .populate("bus", "alternate")
    .lean();

  for (const stu of students) {
    const busToFetch = stu.bus.alternate.enabled
      ? stu.bus.alternate.bus
      : stu.bus._id;

    const bus = await Bus.findById(busToFetch)
      .select("name no_plate status device")
      .lean();

    results.push({
      student: {
        admission_no: stu.admission_no,
        name: UC.getPersonName(stu.name),
      },
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
  const searchField = "all";
  const searchValue = req.query.search;
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

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = [
        "admission_no",
        "name.f",
        "name.m",
        "name.l",
        "email",
        "address.current",
        "address.permanent",
      ];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
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
      name: UC.getPersonName(result.student.name),
    };

    result.bus = result.bus.name;

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
      name: UC.getPersonName(stu.name),
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
  const searchField = req.query.sf || "all";
  const searchValue = req.query.sv;

  const manager = req.user.manager;
  const school = req.user.school;

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

  const students = await Student.find({ parent: req.user._id, manager, school })
    .select("_id admission_no name")
    .lean();

  const query = {
    date: { $gte: dtStart, $lte: dtEnd },
    student: students.map((s) => s._id),
    // sent: true,
  };

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = [
        "admission_no",
        "name.f",
        "name.m",
        "name.l",
        "email",
        "address.current",
        "address.permanent",
      ];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
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
      name: UC.getPersonName(result.student.name),
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

  const school_ = await School.findOne({ school })
    .select("bus_incharge")
    .lean();

  const students = await Student.find({ parent: req.user._id, manager, school })
    .select("_id admission_no name bus")
    .populate("bus", "alternate")
    .lean();

  const results = [];

  for (const s of students) {
    let busToFetch = s.bus.alternate.enabled ? s.bus.alternate.bus : s.bus._id;
    const bus = await Bus.findById(busToFetch)
      .select("name driver conductor")
      .populate("driver conductor", "name email phone")
      .lean();

    results.push({
      student: { admission_no: s.admission_no, name: UC.getPersonName(s.name) },
      bus: bus.name,
      bus_incharge: school_?.bus_incharge,
      driver: {
        name: UC.getPersonName(bus.driver.name),
        email: bus.driver.email,
        phone: bus.driver.phone,
      },
      conductor: {
        name: UC.getPersonName(bus.conductor.name),
        email: bus.conductor.email,
        phone: bus.conductor.phone,
      },
    });
  }

  res.status(200).json(results);
});

module.exports = {
  getParentAccountInfo,
  addStudent,
  trackBus,
  getStudentAttendance,
  getStudentAttendanceCount,
  getStudentAttendanceNotification,
  getStudentBusContactInfo,
};
