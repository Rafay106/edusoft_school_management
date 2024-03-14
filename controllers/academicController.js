const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Class = require("../models/academics/classModel");
const User = require("../models/system/userModel");
const Section = require("../models/academics/sectionModel");
const Student = require("../models/academics/studentModel");
const Bus = require("../models/transport/busModel");

/** 6. Class */

// @desc    Get all classes
// @route   GET /api/admin-panel/class
// @access  Private
const getClasses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf;
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

  const results = await UC.paginatedQuery(Class, query, {}, page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a class
// @route   GET /api/admin-panel/class/:id
// @access  Private
const getClass = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const stuClass = await Class.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!stuClass) {
    res.status(404);
    throw new Error(C.getResourse404Error("Class", req.params.id));
  }

  res.status(200).json(stuClass);
});

// @desc    Add a class
// @route   POST /api/admin-panel/class
// @access  Private
const addClass = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await User.any({ _id: manager, type: C.MANAGER }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await User.any({ _id: school, type: C.SCHOOL, manager }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const stuClass = await Class.create({
    name: req.body.name,
    manager,
    school,
  });

  res.status(201).json({ msg: stuClass._id });
});

// @desc    Update a class
// @route   PUT /api/admin-panel/class/:id
// @access  Private
const updateClass = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.user = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const stuClass = await Class.findOne(query).select("_id").lean();

  if (!stuClass) {
    res.status(404);
    throw new Error(C.getResourse404Error("Class", req.params.id));
  }

  const result = await Class.updateOne(query, {
    $set: {
      name: req.body.name,
      "device.name": req.body.device.name,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a class
// @route   DELETE /api/admin-panel/class/:id
// @access  Private
const deleteClass = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.user = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const result = await Class.deleteOne(query);

  res.status(200).json(result);
});

/** 7. Section */

// @desc    Get all sections
// @route   GET /api/admin-panel/section
// @access  Private
const getSections = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf;
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
    Section,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a section
// @route   GET /api/admin-panel/section/:id
// @access  Private
const getSection = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const section = await Section.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!section) {
    res.status(404);
    throw new Error(C.getResourse404Error("Section", req.params.id));
  }

  res.status(200).json(section);
});

// @desc    Add a section
// @route   POST /api/admin-panel/section
// @access  Private
const addSection = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await User.any({ _id: manager, type: C.MANAGER }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await User.any({ _id: school, type: C.SCHOOL, manager }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const section = await Section.create({
    name: req.body.name,
    manager,
    school,
  });

  res.status(201).json({ msg: section._id });
});

// @desc    Update a section
// @route   PUT /api/admin-panel/section/:id
// @access  Private
const updateSection = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.user = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const section = await Section.findOne(query).select("_id").lean();

  if (!section) {
    res.status(404);
    throw new Error(C.getResourse404Error("Section", req.params.id));
  }

  const result = await Section.updateOne(query, {
    $set: {
      name: req.body.name,
      "device.name": req.body.device.name,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a section
// @route   DELETE /api/admin-panel/section/:id
// @access  Private
const deleteSection = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.user = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const result = await Section.deleteOne(query);

  res.status(200).json(result);
});

/** 5. Student */

// @desc    Get all students
// @route   GET /api/admin-panel/student
// @access  Private
const getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf;
  const searchValue = req.query.sv;

  const query = {};

  if (C.isSchool(req.user.type)) {
    query.user = req.user._id;
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

  const results = await UC.paginatedQuery(
    Student,
    query,
    "name gender phone email admissionNo",
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a student
// @route   GET /api/admin-panel/student/:id
// @access  Private
const getStudent = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.user = req.user._id;
    query.manager = req.user.manager;
  } else if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const student = await Student.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!student) {
    res.status(404);
    throw new Error(C.getResourse404Error("Student", req.params.id));
  }

  res.status(200).json(student);
});

// @desc    Get required data to add a student
// @route   GET /api/admin-panel/student/required-data
// @access  Private
const requiredDataStudent = asyncHandler(async (req, res) => {
  const busQuery = {};
  const bus = [];

  if (C.isSchool(req.user.type)) {
    busQuery.user = req.user._id;
    busQuery.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    busQuery.manager = req.user._id;
  }

  res.status(200).json({
    type: type.sort(),
  });
});

// @desc    Add a student
// @route   POST /api/admin-panel/student
// @access  Private
const addStudent = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await User.any({ _id: manager, type: C.MANAGER }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await User.any({ _id: school, type: C.SCHOOL, manager }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const name = {
    f: req.body.fname,
    m: req.body.mname,
    l: req.body.lname,
  };

  const photo = req.file
    ? req.file.path.toString().replace("uploads\\", "").replace("\\", "/")
    : "";

  const address = {
    current: req.body.address_current,
    permanent: req.body.address_permanent,
  };

  // Validate bus
  const bus = await Bus.findOne({ _id: req.body.bus, manager, school })
    .select("stops")
    .lean();

  if (!bus) {
    res.status(400);
    throw new Error(C.getResourse404Error("bus", req.body.bus));
  }

  // Validate bus-stops
  const stops = req.body.busStops.split(",");

  if (!stops || stops.length < 1) {
    res.status(400);
    throw new Error(C.getFieldIsReq("busStops"));
  }

  for (const stop of stops) {
    if (!bus.stops.find((s) => s.toString() === stop)) {
      res.status(400);
      throw new Error(C.getResourse404Error("busStop", stop));
    }
  }

  if (!(await Class.any({ _id: req.body.class, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("class", req.body.class));
  }

  if (!(await Section.any({ _id: req.body.section, manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("section", req.body.section));
  }

  const student = await Student.create({
    admissionNo: req.body.admissionNo,
    rollNo: req.body.rollNo,
    name,
    dob: req.body.dob,
    cast: req.body.cast,
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
    school: school._id,
    bus: req.body.bus,
    busStops: stops,
    class: req.body.class,
    section: req.body.section,
    manager,
    school,
  });

  res.status(201).json({ msg: student._id });
});

// @desc    Update a student
// @route   PUT /api/admin-panel/student/:id
// @access  Private
const updateStudent = asyncHandler(async (req, res) => {
  const query = [C.SUPERADMIN, C.ADMIN].includes(req.user.type)
    ? { _id: req.params.id }
    : { _id: req.params.id, manager: req.user._id };

  if (!(await Student.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Student", req.params.id));
  }

  let manager = req.body.manager;
  const isAdmins = [C.SUPERADMIN, C.ADMIN].includes(req.user.type);
  if (isAdmins && manager) {
    if (!(await User.any({ _id: manager }))) {
      res.status(400);
      throw new Error(C.getResourse404Error("User", manager));
    }
  } else manager = req.user._id;

  const result = await Student.updateOne(query, {
    $set: {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      pincode: req.body.pincode,
      lat: parseFloat(req.body.lat).toFixed(6),
      lon: parseFloat(req.body.lon).toFixed(6),
      radius: req.body.radius,
      manager,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a student
// @route   DELETE /api/admin-panel/student/:id
// @access  Private
const deleteStudent = asyncHandler(async (req, res) => {
  const query = [C.SUPERADMIN, C.ADMIN].includes(req.user.type)
    ? { _id: req.params.id }
    : { _id: req.params.id, manager: req.user._id };

  const result = await Student.deleteOne(query);

  if (result.deletedCount === 0) {
    res.status(400);
    throw new Error(C.getResourse404Error("Student", req.params.id));
  }

  res.status(200).json(result);
});

// @desc    Bulk operations for student
// @route   POST /api/admin-panel/student/bulk
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

// @desc    Add pickup locations for student
// @route   POST /api/admin-panel/student/pik-loc/:id
// @access  Private
const addPickupLocation = asyncHandler(async (req, res) => {
  const query = [C.SUPERADMIN, C.ADMIN].includes(req.user.type)
    ? { _id: req.params.id }
    : { _id: req.params.id, manager: req.user._id };

  if (!(await Student.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Student", req.params.id));
  }

  const result = await Student.updateOne(query, {
    $push: {
      pickupLocations: {
        address: req.body.address,
        lat: parseFloat(req.body.lat).toFixed(6),
        lon: parseFloat(req.body.lon).toFixed(6),
        radius: req.body.radius,
      },
    },
  });

  res.status(200).json(result);
});

// @desc    Add pickup locations for student
// @route   DELETE /api/admin-panel/student/pik-loc/:id
// @access  Private
const removePickupLocation = asyncHandler(async (req, res) => {
  const query = [C.SUPERADMIN, C.ADMIN].includes(req.user.type)
    ? { _id: req.params.id }
    : { _id: req.params.id, manager: req.user._id };

  if (!(await Student.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Student", req.params.id));
  }

  const result = await Student.updateOne(query, {
    $pull: { pickupLocations: { _id: req.body.id } },
  });

  res.status(200).json(result);
});

module.exports = {
  getClasses,
  getClass,
  addClass,
  updateClass,
  deleteClass,

  getSections,
  getSection,
  addSection,
  updateSection,
  deleteSection,

  getStudents,
  getStudent,
  addStudent,
  updateStudent,
  deleteStudent,
  bulkOpsStudent,
  addPickupLocation,
  removePickupLocation,
};
