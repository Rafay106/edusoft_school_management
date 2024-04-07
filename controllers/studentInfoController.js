const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const StudentType = require("../models/studentInfo/studentTypeModel");
const Student = require("../models/studentInfo/studentModel");
const User = require("../models/system/userModel");
const AcademicYear = require("../models/academics/academicYearModel");
const Class = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const Bus = require("../models/transport/busModel");
const StuBusAtt = require("../models/attendance/stuBusAttModel");

const bcrypt = require("bcrypt");
const StuAttNotification = require("../models/attendance/stuAttNotifyModel");
const BusStop = require("../models/transport/busStopModel");

/** 1. StudentType */

// @desc    Get StudentTypes
// @route   GET /api/student-info/student-type
// @access  Private
const getStudentTypes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf || "all";
  const searchValue = req.query.sv;

  const query = {};

  if (C.isManager(req.user.type)) query.manager = req.user._id;
  else if (C.isSchool(req.user.type)) query.school = req.user._id;

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = ["name"];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  const results = await UC.paginatedQuery(
    StudentType,
    query,
    "name",
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a StudentType
// @route   GET /api/student-info/student-type/:id
// @access  Private
const getStudentType = asyncHandler(async (req, res) => {
  const type = await StudentType.findOne({
    _id: req.params.id,
  }).lean();

  if (!type) {
    res.status(404);
    throw new Error(C.getResourse404Error("StudentType", req.params.id));
  }

  res.status(200).json(type);
});

// @desc    Add a StudentType
// @route   POST /api/student-info/student-type
// @access  Private
const addStudentType = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const type = await StudentType.create({
    name: req.body.name,
    manager,
    school,
  });

  res.status(201).json({ msg: type._id });
});

// @desc    Update a StudentType
// @route   PATCH /api/student-info/student-type/:id
// @access  Private
const updateStudentType = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await StudentType.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("StudentType", req.params.id));
  }

  const result = await StudentType.updateOne(query, {
    $set: { name: req.body.name },
  });

  res.status(200).json(result);
});

// @desc    Delete a StudentType
// @route   DELETE /api/student-info/student-type/:id
// @access  Private
const deleteStudentType = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const result = await StudentType.deleteOne(query);

  res.status(200).json(result);
});

/** 2. Student */

// @desc    Get all students
// @route   GET /api/student-info/student
// @access  Private
const getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf || "all";
  const searchValue = req.query.sv;

  const query = {};

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  } else if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = [
        "name.f",
        "name.m",
        "name.l",
        "phone",
        "email",
        "admissionNo",
        "gender",
      ];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  const select = {
    admission_no: 1,
    name: 1,
    email: 1,
    phone: 1,
    photo: 1,
    rfid: 1,
    academic_year: 1,
    class: 1,
    section: 1,
    bus: 1,
    bus_stop: 1,
    gender: 1,
    parent: 1,
  };

  const populate = [
    "academic_year class section bus bus_stop parent manager school",
    "name title",
  ];

  if (C.isAdmins(req.user.type)) {
    select.school = 1;
    select.manager = 1;
  } else if (C.isManager(req.user.type)) {
    select.school = 1;
  }

  const results = await UC.paginatedQuery(
    Student,
    query,
    select,
    page,
    limit,
    sort,
    populate
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  for (const s of results.result) {
    s.name = UC.getPersonName(s.name);

    if (!s.photo) s.photo = `${process.env.DOMAIN}/user-blank.svg`;
    else s.photo = `${process.env.DOMAIN}/uploads/student/${s.photo}`;

    s.academic_year = s.academic_year.title;
    s.class = s.class.name;
    s.section = s.section.name;
    s.bus = s.bus.name;
    s.bus_stop = s.bus_stop.name;
    if (s.parent) s.parent = s.parent.name;
  }

  res.status(200).json(results);
});

// @desc    Get a student
// @route   GET /api/student-info/student/:id
// @access  Private
const getStudent = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const student = await Student.findOne(query)
    .populate(
      "academic_year class section bus bus_stop parent manager school",
      "name title"
    )
    .lean();

  if (!student) {
    res.status(404);
    throw new Error(C.getResourse404Error("Student", req.params.id));
  }

  student.name = UC.getPersonName(student.name);

  if (!student.photo) student.photo = `${process.env.DOMAIN}/user-blank.svg`;
  else student.photo = `${process.env.DOMAIN}/uploads/student/${student.photo}`;

  res.status(200).json(student);
});

// @desc    Add a student
// @route   POST /api/student-info/student
// @access  Private
const addStudent = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;
  const ayear = req.body.ayear;
  const class_ = req.body.class;
  const section = req.body.section;
  const studentType = req.body.student_type;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (!school) {
    res.status(400);
    throw new Error(C.getFieldIsReq("school"));
  }

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const name = {
    f: req.body.fname,
    m: req.body.mname,
    l: req.body.lname,
  };

  const photo = req.file ? req.file.filename : "";

  const address = {
    current: req.body.address_current,
    permanent: req.body.address_permanent,
  };

  // Validate academic-year
  if (!studentType) {
    res.status(400);
    throw new Error(C.getFieldIsReq("student_type"));
  }

  if (!(await StudentType.any({ _id: studentType, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("AcademicYear", studentType));
  }

  // Validate academic-year
  if (!ayear) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await AcademicYear.any({ _id: ayear, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("AcademicYear", ayear));
  }

  // Validate class
  if (!class_) {
    res.status(400);
    throw new Error(C.getFieldIsReq("class"));
  }

  if (!(await Class.any({ _id: class_, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Class", class_));
  }

  // Validate section
  if (!section) {
    res.status(400);
    throw new Error(C.getFieldIsReq("section"));
  }

  if (!(await Section.any({ _id: section, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Section", section));
  }

  // Validate bus
  if (!req.body.bus) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus"));
  }

  const bus = await Bus.findOne({ _id: req.body.bus, manager, school })
    .select("stops")
    .lean();

  if (!bus) {
    res.status(400);
    throw new Error(C.getResourse404Error("Bus", req.body.bus));
  }

  // Validate bus-stop
  if (!req.body.busStop) {
    res.status(400);
    throw new Error(C.getFieldIsReq("busStop"));
  }

  if (!bus.stops.find((s) => s.toString() === req.body.busStop)) {
    res.status(400);
    throw new Error(C.getResourse404Error("BusStop", req.body.busStop));
  }

  const student = await Student.create({
    admission_no: req.body.admNo,
    password: "123456",
    roll_no: req.body.rollNo,
    name,
    dob: req.body.dob,
    cast: req.body.cast,
    student_type: studentType,
    email: req.body.email,
    phone: req.body.phone,
    doa: req.body.doa,
    photo,
    age: req.body.age,
    height: req.body.height,
    weight: req.body.weight,
    address,
    rfid: req.body.rfid,
    gender: req.body.gender,
    academic_year: req.body.ayear,
    class: class_,
    section,
    bus,
    bus_stop: req.body.busStop,
    manager,
    school,
  });

  res.status(201).json({ msg: student._id });
});

// @desc    Update a student
// @route   PATCH /api/student-info/student/:id
// @access  Private
const updateStudent = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await Student.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Student", req.params.id));
  }

  const photo = req.file ? req.file.filename : undefined;

  const studentType = req.body.student_type;

  if (studentType && !(await StudentType.any({ ...query, _id: studentType }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("StudentType", studentType));
  }

  const class_ = req.body.class;

  if (class_ && !(await Class.any({ ...query, _id: class_ }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Class", class_));
  }

  const section = req.body.section;

  if (section && !(await Section.any({ ...query, _id: section }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Section", section));
  }

  const bus = req.body.bus;

  if (bus && !(await Bus.any({ ...query, _id: bus }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Bus", bus));
  }

  const bus_stop = req.body.bus_stop;

  if (bus_stop && !(await BusStop.any({ ...query, _id: bus_stop }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("BusStop", bus_stop));
  }

  const result = await Student.updateOne(query, {
    $set: {
      admission_no: req.body.admission_no,
      roll_no: req.body.roll_no,
      name: req.body.name,
      dob: req.body.dob,
      cast: req.body.cast,
      student_type: studentType,
      email: req.body.email,
      phone: req.body.phone,
      doa: req.body.doa,
      photo,
      age: req.body.age,
      height: req.body.height,
      weight: req.body.weight,
      address: req.body.address,
      rfid: req.body.rfid,
      gender: req.body.gender,
      class: class_,
      section,
      bus,
      bus_stop,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a student
// @route   DELETE /api/student-info/student/:id
// @access  Private
const deleteStudent = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await Student.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Student", req.params.id));
  }

  const result = await Student.deleteOne(query);

  res.status(200).json(result);
});

// @desc    Bulk operations for student
// @route   POST /api/student-info/student/bulk
// @access  Private
const bulkOpsStudent = asyncHandler(async (req, res) => {
  const cmd = req.body.cmd;
  const students = req.body.students;

  if (!cmd) {
    res.status(400);
    throw new Error("cmd is required!");
  }

  if (cmd === "import") {
    const fileData = UC.excelToJson(
      path.join("imports", "student", req.file.filename)
    );

    const result = await UC.addMultipleStudents(
      req.user._id,
      req.user.type,
      fileData
    );

    if (result.status === 400) {
      res.status(result.status);
      const err = new Error(result.errors);
      err.name = "BulkImportError";
      throw err;
    }

    console.log("req.file :>> ", req.file);

    fs.unlinkSync(path.join(req.file.path));

    return res.status(200).json({ msg: result.msg });
  }

  if (!students) {
    res.status(400);
    throw new Error(C.getFieldIsReq("students"));
  }

  if (students.length === 0) {
    res.status(400);
    throw new Error("students array is empty!");
  }

  const query = [C.SUPERADMIN, C.ADMIN].includes(req.user.type)
    ? { _id: students }
    : { _id: students, manager: req.user._id };

  if (cmd === "delete") {
    const result = await Student.deleteMany(query);

    return res.status(200).json(result);
  } else if (cmd === "export-json") {
    const studentsToExport = await Student.find(query)
      .select("-createdAt -updatedAt")
      .sort("name")
      .lean();

    const dt = new Date();
    const Y = String(dt.getUTCFullYear()).padStart(2, "0");
    const M = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const D = String(dt.getUTCDate()).padStart(2, "0");

    const fileName = `Student_${Y}-${M}-${D}.json`;
    const fileDir = path.join(getAppRootDir(__dirname), "temp", fileName);

    fs.writeFileSync(fileDir, JSON.stringify(studentsToExport));

    return res.download(fileDir, fileName, () => {
      fs.unlinkSync(fileDir);
    });
  } else {
    res.status(400);
    throw new Error("cmd not found!");
  }
});

// @desc    Reset student password
// @route   PATCH /api/student-info/student/reset-password
// @access  Private
const resetStudentPassword = asyncHandler(async (req, res) => {
  const _id = req.body.student;
  const oldPass = req.body.old_password;
  const newPass = req.body.new_password;

  const student = await Student.findById(_id).select("password").lean();

  if (!student) {
    res.status(400);
    throw new Error(C.getResourse404Error("student", _id));
  }

  if (!bcrypt.compare(oldPass, student.password)) {
    res.status(400);
    throw new Error(C.INVALID_CREDENTIALS);
  }

  const result = await Student.updateOne(
    { _id },
    { $set: { password: await bcrypt.hash(newPass, 10) } }
  );

  res.status(200).json(result);
});

// @desc    Get student's attendance
// @route   POST /api/student-info/student/attendance
// @access  Private
const getStudentAttendance = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;
  const busIds = req.body.bus_ids;

  if (C.isSchool(req.user.type)) {
    manager = req.user.manager;
    school = req.user._id;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

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

  // Validate bus_ids
  if (!busIds || busIds.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus"));
  }

  const buses = await Bus.find({ _id: busIds, manager, school })
    .select()
    .lean();

  if (buses.length === 0) {
    res.status(400);
    throw new Error(C.getResourse404Error("Bus", busIds));
  }

  const students = await Student.find({
    bus: buses.map((b) => b._id),
    manager,
    school,
  })
    .select("_id admission_no name")
    .lean();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "admission_no";
  const searchField = "all";
  const searchValue = req.query.search;

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
// @route   POST /api/student-info/student/attendance-notification
// @access  Private
const getStuAttNotification = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "admission_no";
  const searchField = req.query.sf || "all";
  const searchValue = req.query.sv;

  let manager = req.body.manager;
  let school = req.body.school;
  const date = req.body.date;
  const busIds = req.body.bus_ids;

  if (C.isSchool(req.user.type)) {
    manager = req.user.manager;
    school = req.user._id;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await UC.managerExists(manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await UC.schoolAccExists(school, manager))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  // Validate bus_ids
  if (!busIds || busIds.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus"));
  }

  const buses = await Bus.find({ _id: busIds, manager, school })
    .select()
    .lean();

  if (buses.length === 0) {
    res.status(400);
    throw new Error(C.getResourse404Error("Bus", busIds));
  }

  const students = await Student.find({
    bus: buses.map((b) => b._id),
    manager,
    school,
  })
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
  getStudentTypes,
  getStudentType,
  addStudentType,
  updateStudentType,
  deleteStudentType,

  getStudents,
  getStudent,
  addStudent,
  updateStudent,
  deleteStudent,
  bulkOpsStudent,
  resetStudentPassword,
  getStudentAttendance,
  getStuAttNotification,
};
