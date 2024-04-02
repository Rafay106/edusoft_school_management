const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const User = require("../models/system/userModel");
const Student = require("../models/studentInfo/studentModel");
const StuBusAtt = require("../models/attendance/stuBusAttModel");
const StuAttNotification = require("../models/attendance/stuAttNotifyModel");
const Bus = require("../models/transport/busModel");

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
    .lean();

  console.log(students);

  for (const stu of students) {
    const bus = await Bus.findOne({ _id: stu.bus, manager, school })
      .select("name alternate device")
      .lean();

    console.log(bus);

    if (bus.alternate.enabled) {
      const altBus = await Bus.findById(bus.alternate.bus)
        .select("name device")
        .lean();

      results.push({
        student: {
          admission_no: stu.admission_no,
          name: UC.getStudentName(stu.name),
        },
        imei: altBus.device.imei,
        dt_server: altBus.device.dt_server,
        dt_tracker: altBus.device.dt_tracker,
        lat: altBus.device.lat,
        lon: altBus.device.lon,
        speed: altBus.device.speed,
        altitude: altBus.device.altitude,
        angle: altBus.device.angle,
      });
    } else {
      results.push({
        student: {
          admission_no: stu.admission_no,
          name: UC.getStudentName(stu.name),
        },
        imei: bus.device.imei,
        dt_server: bus.device.dt_server,
        dt_tracker: bus.device.dt_tracker,
        lat: bus.device.lat,
        lon: bus.device.lon,
        speed: bus.device.speed,
        altitude: bus.device.altitude,
        angle: bus.device.angle,
      });
    }
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

  // Validate date
  if (!req.body.date) {
    res.status(400);
    throw new Error(C.getFieldIsReq("date"));
  }

  const date = new Date(req.body.date);

  if (isNaN(date)) {
    res.status(400);
    throw new Error("date is invalid!");
  }

  date.setUTCHours(0, 0, 0, 0);

  const students = await Student.find({ parent: req.user._id, manager, school })
    .select("_id admission_no name")
    .lean();

  const query = { date, student: students.map((s) => s._id) };

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

  res.status(200).json(results);
});

// @desc    Get student's attendance notification
// @route   POST /api/parent/student/attendance-notification
// @access  Private
const getStuAttNotification = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "admission_no";
  const searchField = req.query.sf || "all";
  const searchValue = req.query.sv;

  const manager = req.user.manager;
  const school = req.user.school;
  const date = req.body.date;

  const students = await Student.find({ parent: req.user._id, manager, school })
    .select("_id admission_no name")
    .lean();

  const query = { date, student: students.map((s) => s._id) };

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
    StuAttNotification,
    query,
    {},
    page,
    limit,
    sort,
    ["student bus", "admission_no name"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

module.exports = {
  getParentAccountInfo,
  addStudent,
  trackBus,
  getStudentAttendance,
  getStuAttNotification,
};
