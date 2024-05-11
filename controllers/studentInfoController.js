const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const BoardingType = require("../models/studentInfo/boardingTypeModel");
const Student = require("../models/studentInfo/studentModel");
const Class = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const Bus = require("../models/transport/busModel");
const StuBusAtt = require("../models/attendance/stuBusAttModel");
const StuAttEvent = require("../models/attendance/stuAttEventModel");
const BusStop = require("../models/transport/busStopModel");
const SubWard = require("../models/studentInfo/subwardTypeModel");
const Stream = require("../models/academics/streamModel");

/** 1. BoardingType */

// @desc    Get BoardingTypes
// @route   GET /api/student-info/boarding-type
// @access  Private
const getBoardingTypes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["name"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    BoardingType,
    query,
    "",
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a BoardingType
// @route   GET /api/student-info/boarding-type/:id
// @access  Private
const getBoardingType = asyncHandler(async (req, res) => {
  const type = await BoardingType.findOne({
    _id: req.params.id,
  }).lean();

  if (!type) {
    res.status(404);
    throw new Error(C.getResourse404Id("BoardingType", req.params.id));
  }

  res.status(200).json(type);
});

// @desc    Add a BoardingType
// @route   POST /api/student-info/boarding-type
// @access  Private
const addBoardingType = asyncHandler(async (req, res) => {
  const type = await BoardingType.create({
    name: req.body.name,
    school: req.school._id,
  });

  res.status(201).json({ msg: type._id });
});

// @desc    Update a BoardingType
// @route   PATCH /api/student-info/boarding-type/:id
// @access  Private
const updateBoardingType = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await BoardingType.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("BoardingType", req.params.id));
  }

  const result = await BoardingType.updateOne(query, {
    $set: { name: req.body.name },
  });

  res.status(200).json(result);
});

// @desc    Delete a BoardingType
// @route   DELETE /api/student-info/boarding-type/:id
// @access  Private
const deleteBoardingType = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const result = await BoardingType.deleteOne(query);

  res.status(200).json(result);
});

/** 2. SubWard */

// @desc    Get SubWards
// @route   GET /api/student-info/sub-ward
// @access  Private
const getSubWards = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["name"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    SubWard,
    query,
    "",
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a SubWard
// @route   GET /api/student-info/sub-ward/:id
// @access  Private
const getSubWard = asyncHandler(async (req, res) => {
  const type = await SubWard.findOne({
    _id: req.params.id,
  }).lean();

  if (!type) {
    res.status(404);
    throw new Error(C.getResourse404Id("SubWard", req.params.id));
  }

  res.status(200).json(type);
});

// @desc    Add a SubWard
// @route   POST /api/student-info/sub-ward
// @access  Private
const addSubWard = asyncHandler(async (req, res) => {
  const type = await SubWard.create({
    name: req.body.name,
    school: req.school._id,
  });

  res.status(201).json({ msg: type._id });
});

// @desc    Update a SubWard
// @route   PATCH /api/student-info/sub-ward/:id
// @access  Private
const updateSubWard = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await SubWard.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("SubWard", req.params.id));
  }

  const result = await SubWard.updateOne(query, {
    $set: { name: req.body.name },
  });

  res.status(200).json(result);
});

// @desc    Delete a SubWard
// @route   DELETE /api/student-info/sub-ward/:id
// @access  Private
const deleteSubWard = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const result = await SubWard.deleteOne(query);

  res.status(200).json(result);
});

/** 3. Student */

// @desc    Get all students
// @route   GET /api/student-info/student
// @access  Private
const getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const ayear = UC.getCurrentAcademicYear(req.school);

  const query = { academic_year: ayear };

  if (search) {
    const fields = ["admission_no", "name", "phone", "email"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
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
    bus_pick: 1,
    bus_drop: 1,
    bus_stop: 1,
    gender: 1,
    parent: 1,
  };

  const populate = [
    "academic_year class section bus_pick bus_drop bus_stop parent school",
    "name title",
  ];

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
    if (!s.photo) s.photo = `${process.env.DOMAIN}/user-blank.svg`;
    else s.photo = `${process.env.DOMAIN}/uploads/student/${s.photo}`;
  }

  res.status(200).json(results);
});

// @desc    Get a student
// @route   GET /api/student-info/student/:id
// @access  Private
const getStudent = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const student = await Student.findOne(query)
    .populate(
      "academic_year class section bus bus_stop parent manager school",
      "name title"
    )
    .lean();

  if (!student) {
    res.status(404);
    throw new Error(C.getResourse404Id("Student", req.params.id));
  }

  if (!student.photo) student.photo = `${process.env.DOMAIN}/user-blank.svg`;
  else student.photo = `${process.env.DOMAIN}/uploads/student/${student.photo}`;

  res.status(200).json(student);
});

// @desc    Add a student
// @route   POST /api/student-info/student
// @access  Private
const addStudent = asyncHandler(async (req, res) => {
  const ayear = await UC.getCurrentAcademicYear(req.school);

  if (!req.body.class) {
    res.status(400);
    throw new Error(C.getFieldIsReq("class"));
  }

  const class_ = await Class.findOne({ name: req.body.class.toUpperCase() })
    .select("_id")
    .lean();

  if (!class_) {
    res.status(400);
    throw new Error(C.getResourse404Id("class", req.body.class));
  }

  if (!req.body.section) {
    res.status(400);
    throw new Error(C.getFieldIsReq("section"));
  }

  const section = await Section.findOne({
    name: req.body.section.toUpperCase(),
  })
    .select("_id")
    .lean();

  if (!section) {
    res.status(400);
    throw new Error(C.getResourse404Id("section", req.body.section));
  }

  if (!req.body.stream) {
    res.status(400);
    throw new Error(C.getFieldIsReq("stream"));
  }

  const stream = await Stream.findOne({
    name: req.body.stream.toUpperCase(),
  })
    .select("_id")
    .lean();

  if (!stream) {
    res.status(400);
    throw new Error(C.getResourse404Id("stream", req.body.stream));
  }

  if (req.body.adm_class) req.body.adm_class = req.body.adm_class.toUpperCase();

  const atClass = await Class.findOne({ name: req.body.adm_class })
    .select("_id")
    .lean();

  const boardingType = await BoardingType.findOne({
    name: req.body.boarding ? req.body.boarding.toUpperCase() : "NA",
  })
    .select("_id")
    .lean();

  const subward = await SubWard.findOne({
    name: req.body.subward ? req.body.subward.toUpperCase() : "NA",
  })
    .select("_id")
    .lean();

  if (!req.body.bus_pick) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus_pick"));
  }

  const busPick = await Bus.findOne({ name: req.body.bus_pick.toUpperCase() })
    .select("_id")
    .lean();

  if (!busPick) {
    res.status(400);
    throw new Error(C.getResourse404Id("bus_pick", req.body.bus_pick));
  }

  if (!req.body.bus_drop) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus_drop"));
  }

  const busDrop = await Bus.findOne({ name: req.body.bus_drop.toUpperCase() })
    .select("_id")
    .lean();

  if (!busDrop) {
    res.status(400);
    throw new Error(C.getResourse404Id("bus_drop", req.body.bus_drop));
  }

  if (!req.body.bus_stop) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus_stop"));
  }

  const busStop = await BusStop.findOne({
    name: req.body.bus_stop.toUpperCase(),
  })
    .select("_id")
    .lean();

  if (!busStop) {
    res.status(400);
    throw new Error(C.getResourse404Id("bus_stop", req.body.bus_stop));
  }

  const photo = req.file ? req.file.filename : "";

  console.log(subward);
  const student = await Student.create({
    admission_no: req.body.adm_no,
    admission_serial: req.body.adm_sr,
    student_id: req.body.student_id,
    roll_no: req.body.roll_no,
    name: req.body.name,
    class: class_,
    section,
    stream,
    admission_time_class: atClass,
    gender: req.body.gender,
    house: req.body.house,
    blood_group: req.body.blood_group,
    staff_child: req.body.staff_child || false,
    doa: req.body.doa,
    student_status: req.body.student_status || "na",
    student_left: req.body.student_left || false,
    phone: req.body.phone,
    father_details: {
      name: req.body.father_name,
      phone: req.body.father_phone,
      designation: req.body.father_designation,
      office_address: req.body.father_office_address,
      job_title: req.body.father_job_title,
      adhaar: req.body.father_adhaar,
    },
    mother_details: {
      name: req.body.mother_name,
      phone: req.body.mother_phone,
      job_title: req.body.mother_job_title,
      adhaar: req.body.mother_adhaar,
    },
    dob: req.body.dob,
    age: req.body.age,
    address: {
      permanent: req.body.add_permanent,
      correspondence: req.body.add_correspondence,
    },
    religion: req.body.religion,
    cast: req.body.cast || "NA",
    boarding_type: boardingType,
    sub_ward: subward,
    student_club: req.body.student_club,
    student_work_exp: req.body.student_work_exp,
    language_2nd: req.body.language_2nd,
    language_3rd: req.body.language_3rd,
    exam_subjects: {
      one: req.body.exam_sub_1,
      two: req.body.exam_sub_2,
      three: req.body.exam_sub_3,
      four: req.body.exam_sub_4,
      five: req.body.exam_sub_5,
      six: req.body.exam_sub_6,
      seven: req.body.exam_sub_7,
      eight: req.body.exam_sub_8,
      nine: req.body.exam_sub_9,
      ten: req.body.exam_sub_10,
    },
    ews_applicable: req.body.ews_applicable || false,
    bank_details: {
      name: req.body.bank_name,
      account_type: req.body.bank_account_type,
      account_holder: req.body.bank_account_holder,
      account_no: req.body.bank_account_no,
      ifsc: req.body.bank_ifsc,
    },
    relation_with_student: req.body.relation_with_student,
    class_teacher: req.body.class_teacher,
    bus_pick: busPick,
    bus_drop: busDrop,
    bus_stop: busStop,
    student_adhaar: req.body.student_adhaar,
    sibling: req.body.sibling || false,
    single_girl_child: req.body.single_girl_child || false,
    handicapped: req.body.handicapped || false,
    email: req.body.email || req.body.adm_no.replace("/", "_") + "@gmail.com",
    photo,
    height: req.body.height,
    weight: req.body.weight,
    rfid: req.body.rfid,
    academic_year: ayear,
    school: req.school,
  });

  res.status(201).json({ msg: student._id });
});

// @desc    Update a student
// @route   PATCH /api/student-info/student/:id
// @access  Private
const updateStudent = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await Student.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Id("Student", req.params.id));
  }

  const photo = req.file ? req.file.filename : undefined;

  const studentType = req.body.student_type;

  if (
    studentType &&
    !(await BoardingType.any({ ...query, _id: studentType }))
  ) {
    res.status(400);
    throw new Error(C.getResourse404Id("BoardingType", studentType));
  }

  const class_ = req.body.class;

  if (class_ && !(await Class.any({ ...query, _id: class_ }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("Class", class_));
  }

  const section = req.body.section;

  if (section && !(await Section.any({ ...query, _id: section }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("Section", section));
  }

  const bus = req.body.bus;

  if (bus && !(await Bus.any({ ...query, _id: bus }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("Bus", bus));
  }

  const bus_stop = req.body.bus_stop;

  if (bus_stop && !(await BusStop.any({ ...query, _id: bus_stop }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("BusStop", bus_stop));
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

  if (!(await Student.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Id("Student", req.params.id));
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

// @desc    Get student's attendance
// @route   POST /api/student-info/student/attendance
// @access  Private
const getStudentAttendance = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "date";
  const searchField = "all";
  const searchValue = req.query.search;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");
  const busIds = req.body.bus_ids;

  // Validate bus_ids
  if (!busIds || busIds.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus"));
  }

  const buses = await Bus.find({ _id: busIds }).select().lean();

  if (buses.length === 0) {
    res.status(400);
    throw new Error(C.getResourse404Id("Bus", busIds));
  }

  const students = await Student.find({
    bus: buses.map((b) => b._id),
  })
    .select("_id admission_no name")
    .lean();

  const query = {
    date: { $gte: dtStart, $lte: dtEnd },
    student: students.map((s) => s._id),
  };

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = [
        "student.admission_no",
        "student.name.f",
        "student.name.m",
        "student.name.l",
        "bus.name",
      ];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  query["$or"] = [
    { "student.admission_no": { $regex: "TEST", $options: "i" } },
  ];

  console.log("query :>> ", query);

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

  // for (const result of results.result) {
  //   result.student = {
  //     ...result.student,
  //     name:(result.student.name),
  //   };

  //   result.bus = result.bus.name;

  //   for (const list of result.list) {
  //     if (list.tag === C.M_ENTRY) list.tag = "Picked from Stoppage";
  //     else if (list.tag === C.M_EXIT) list.tag = "Dropped at School";
  //     else if (list.tag === C.A_ENTRY) list.tag = "Picked from School";
  //     else if (list.tag === C.A_EXIT) list.tag = "Dropped at Stoppage";
  //   }
  // }

  res.status(200).json(results);
});

// @desc    Get student's attendance notification
// @route   POST /api/student-info/student/attendance-notification
// @access  Private
const getStuAttNotification = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "date";
  const searchField = req.query.sf || "all";
  const searchValue = req.query.sv;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");
  const busIds = req.body.bus_ids;

  // Validate bus_ids
  if (!busIds || busIds.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus"));
  }

  const buses = await Bus.find({ _id: busIds }).select().lean();

  if (buses.length === 0) {
    res.status(400);
    throw new Error(C.getResourse404Id("Bus", busIds));
  }

  const students = await Student.find({
    bus: buses.map((b) => b._id),
  })
    .select("_id admission_no name")
    .lean();

  const query = {
    date: { $gte: dtStart, $lte: dtEnd },
    student: students.map((s) => s._id),
  };

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = [
        "student.admission_no",
        "student.name.f",
        "student.name.m",
        "student.name.l",
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
    ["student bus", "admission_no name email"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  for (const result of results.result) {
    result.bus = result.bus.name;
  }

  res.status(200).json(results);
});

module.exports = {
  getBoardingTypes,
  getBoardingType,
  addBoardingType,
  updateBoardingType,
  deleteBoardingType,

  getSubWards,
  getSubWard,
  addSubWard,
  updateSubWard,
  deleteSubWard,

  getStudents,
  getStudent,
  addStudent,
  updateStudent,
  deleteStudent,
  bulkOpsStudent,
  getStudentAttendance,
  getStuAttNotification,
};
