const fs = require("node:fs");
const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const BoardingType = require("../models/studentInfo/boardingTypeModel");
const Student = require("../models/studentInfo/studentModel");
const Class = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const Bus = require("../models/transport/busModel");
const StuBusAtt = require("../models/attendance/studentBusAttendanceModel");
const SubWard = require("../models/studentInfo/subwardTypeModel");
const StudentNotification = require("../models/studentInfo/studentNotificationModel");
const StuClassAtt = require("../models/attendance/studentClassAttendanceModel");

const { DOMAIN } = process.env;

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
    query["$or"] = searchQuery;
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
  const names = req.body.names;

  if (!names || names.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("names"));
  }

  const result = [];
  for (const name of names) {
    const type = await BoardingType.create({ name, school: req.school._id });

    result.push(type._id);
  }

  res.status(201).json({ total: result.length, msg: result });
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
  const names = req.params.id.split(",");

  const ids = [];
  for (const name of names) {
    const type = await BoardingType.findOne({
      name: name.toUpperCase(),
      school: req.school._id,
    });

    if (!type) {
      res.status(404);
      throw new Error(C.getResourse404Id("BoardingType", name));
    }

    if (await Student.any({ boarding_type: type._id })) {
      res.status(400);
      throw new Error(C.getUnableToDel("BoardingType", "Student"));
    }

    ids.push(type._id);
  }

  const result = await BoardingType.deleteMany({ _id: ids });

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
    query["$or"] = searchQuery;
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
  const names = req.body.names;

  if (!names || names.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("names"));
  }

  const result = [];
  for (const name of names) {
    const ward = await SubWard.create({ name, school: req.school._id });

    result.push(ward._id);
  }

  res.status(201).json({ total: result.length, msg: result });
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
  const names = req.params.id.split(",");

  const ids = [];
  for (const name of names) {
    const ward = await SubWard.findOne({
      name: name.toUpperCase(),
      school: req.school._id,
    });

    if (!ward) {
      res.status(404);
      throw new Error(C.getResourse404Id("SubWard", name));
    }

    if (await Student.any({ sub_ward: ward._id })) {
      res.status(400);
      throw new Error(C.getUnableToDel("SubWard", "Student"));
    }

    ids.push(ward._id);
  }

  const result = await SubWard.deleteMany({ _id: ids });

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

  const query = { academic_year: req.ayear };

  if (req.query.class) {
    const classId = await UC.validateClassByName(req.query.class, req.ayear);

    query.class = classId;
  }

  if (req.query.boarding_type) {
    const classId = await UC.validateBoardingTypeByName(
      req.query.boarding_type,
      req.ayear
    );

    query.boarding_type = classId;
  }

  if (search) {
    const fields = ["admission_no", "name", "phone", "email", "rfid"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
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
    boarding_type: 1,
    parent: 1,
  };

  const populateConfigs = [
    { path: "academic_year", select: "title" },
    {
      path: "class section bus_stop boarding_type parent school",
      select: "name",
    },
    {
      path: "bus_pick bus_drop",
      select: "name device",
      populate: { path: "device", select: "imei" },
    },
  ];

  const results = await UC.paginatedQueryProPlus(
    Student,
    query,
    select,
    page,
    limit,
    sort,
    populateConfigs
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  for (const s of results.result) {
    if (!s.photo) s.photo = `${DOMAIN}/user-blank.svg`;
    else s.photo = `${DOMAIN}/uploads/student/${s.photo}`;
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
      "academic_year class section bus_pick bus_drop bus_stop parent school",
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
  const classId = await UC.validateClassByName(req.body.class_name, req.ayear);

  const class_ = await Class.findById({ _id: classId }).select("stream").lean();

  const sectionId = await UC.validateSectionByName(req.body.section, req.ayear);

  if (req.body.adm_class) req.body.adm_class = req.body.adm_class.toUpperCase();

  const atClass = await Class.findOne({ name: req.body.adm_class })
    .select("_id")
    .lean();

  const boardingTypeId = await UC.validateBoardingTypeByName(
    req.body.boarding || "NA"
  );

  const subwardId = await UC.validateSubwardByName(req.body.subward || "NA");

  const photo = req.file ? req.file.filename : undefined;

  const studentData = {
    admission_no: req.body.adm_no,
    admission_serial: req.body.adm_sr,
    student_id: req.body.student_id,
    roll_no: req.body.roll_no,
    name: req.body.name,
    class: class_._id,
    section: sectionId,
    stream: class_.stream,
    admission_time_class: atClass?._id,
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
    boarding_type: boardingTypeId,
    sub_ward: subwardId,
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
    student_adhaar: req.body.student_adhaar,
    sibling: req.body.sibling || false,
    single_girl_child: req.body.single_girl_child || false,
    handicapped: req.body.handicapped || false,
    email: req.body.email || req.body.adm_no.replace("/", "_") + "@gmail.com",
    photo,
    height: req.body.height,
    weight: req.body.weight,
    rfid: req.body.rfid,
    academic_year: req.ayear,
    school: req.school,
  };

  const student = await Student.findOne({
    admission_no: studentData.admission_no,
  })
    .select("photo")
    .lean();

  let result;

  if (student) {
    result = await Student.updateOne(
      { admission_no: studentData.admission_no },
      { $set: studentData }
    );
  } else {
    // New student
    const nStudent = await Student.create(studentData);

    result = nStudent._id;
  }

  res.status(201).json({ msg: result });
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

  if (cmd === "import-xlsx") {
    if (!req.file) {
      res.status(400);
      throw new Error(C.getFieldIsReq("file"));
    }

    const fileData = UC.excelToJson(req.file.path);
    fs.unlinkSync(req.file.path);

    const result = await UC.addMultipleStudents(
      fileData,
      req.school,
      req.ayear
    );

    return res.status(200).json({ total: result.length, msg: result });
  } else if (cmd === "import-xlsx-dps") {
    if (!req.file) {
      res.status(400);
      throw new Error(C.getFieldIsReq("file"));
    }

    const fileData = UC.excelToJson(req.file.path);
    fs.unlinkSync(req.file.path);

    const result = await UC.addMultipleStudentsDPS(
      fileData,
      req.school,
      req.ayear
    );

    return res.status(200).json({ total: result.length, msg: result });
  } else if (cmd === "import-xlsx-acharyakulam") {
    if (!req.file) {
      res.status(400);
      throw new Error(C.getFieldIsReq("file"));
    }

    const fileData = UC.excelToJson(req.file.path);
    fs.unlinkSync(req.file.path);

    const result = await UC.addMultipleStudentsAcharyakulam(
      fileData,
      req.school,
      req.ayear
    );

    return res.status(200).json(result);
  } else if (cmd === "import-xlsx-gdgoenka") {
    if (!req.file) {
      res.status(400);
      throw new Error(C.getFieldIsReq("file"));
    }

    const fileData = UC.excelToJson(req.file.path);
    fs.unlinkSync(req.file.path);

    const result = await UC.addMultipleStudentsGDGoenka(
      fileData,
      req.school,
      req.ayear
    );

    return res.status(200).json(result);
  }

  if (!students) {
    res.status(400);
    throw new Error(C.getFieldIsReq("students"));
  }

  if (students.length === 0) {
    res.status(400);
    throw new Error("students array is empty!");
  }

  const query = { _id: students };

  if (cmd === "export-json") {
    const studentsToExport = await Student.find(query)
      .select("-createdAt -updatedAt")
      .sort("name")
      .lean();

    const fileName = `Student_${UC.getYMD()}.json`;
    const fileDir = path.join(
      getAppRootDir(__dirname),
      "data",
      "bulk_exports",
      fileName
    );

    fs.writeFileSync(fileDir, JSON.stringify(studentsToExport));

    return res.download(fileDir, fileName, () => {
      fs.unlinkSync(fileDir);
    });
  } else {
    res.status(400);
    throw new Error("cmd not found!");
  }
});

/** 4. Student Attendance */

// @desc    Get student's bus attendance
// @route   POST /api/student-info/attendance/bus
// @access  Private
const getBusAttendance_old = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "-date";
  const search = req.query.search;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");

  const query = { date: { $gte: dtStart, $lt: dtEnd } };

  const busNames = req.body.bus_names;
  if (busNames && busNames.length > 0) {
    const busIds = await UC.validateBusesFromName(busNames);

    query.$or = [{ "list.bus": busIds }, { bus: busIds }];
  }

  const tag = req.body.tag;
  if (tag) {
    if (tag === "total") {
    } else if (tag === "present") {
      query.$expr = {
        $gt: [{ $size: "$list" }, 0],
      };
    } else if (tag === "absent") {
      if (query.$or) {
        query.$or = [
          ...query.$or,
          { list: { $exists: false } },
          { list: { $size: 0 } },
        ];
      } else query.$or = [{ list: { $exists: false } }, { list: { $size: 0 } }];
    } else if (tag === "mCheckIn") {
      query.list = { $elemMatch: { tag: C.M_ENTRY } };
    } else if (tag === "mCheckOut") {
      query.list = { $elemMatch: { tag: C.M_EXIT } };
    } else if (tag === "aCheckIn") {
      query.list = { $elemMatch: { tag: C.A_ENTRY } };
    } else if (tag === "aCheckOut") {
      query.list = { $elemMatch: { tag: C.A_EXIT } };
    } else if (tag === "mCheckInMissed") {
      query.list = { $not: { $elemMatch: { tag: C.M_ENTRY } } };
    } else if (tag === "mCheckOutMissed") {
      query.list = { $not: { $elemMatch: { tag: C.M_EXIT } } };
    } else if (tag === "aCheckInMissed") {
      query.list = { $not: { $elemMatch: { tag: C.A_ENTRY } } };
    } else if (tag === "aCheckOutMissed") {
      query.list = { $not: { $elemMatch: { tag: C.A_EXIT } } };
    } else if (tag === "inSchool") {
      query.list = {
        $elemMatch: { $or: [{ tag: C.M_ENTRY }, { tag: C.M_EXIT }] },
      };
    } else if (tag === "outSchool") {
      query.list = {
        $elemMatch: { $or: [{ tag: C.A_ENTRY }, { tag: C.A_EXIT }] },
      };
    } else if (tag === "inButNotOutSchool") {
      query.$and = [
        {
          list: {
            $elemMatch: { $or: [{ tag: C.M_ENTRY }, { tag: C.M_EXIT }] },
          },
        },
        {
          list: {
            $not: {
              $elemMatch: { $or: [{ tag: C.A_ENTRY }, { tag: C.A_EXIT }] },
            },
          },
        },
      ];
    } else if (tag === "wrongBus") {
    } else if (tag === "wrongStop") {
    } else {
      res.status(400);
      throw new Error("Invalid tag!");
    }
  }

  if (search) {
    const classes = await Class.find({ name: search.toUpperCase() })
      .select("_id")
      .lean();

    const sections = await Section.find({ name: search.toUpperCase() })
      .select("_id")
      .lean();

    const stuBusAtt = await StuBusAtt.find(query)
      .select("student")
      .populate("student", "name class section")
      .lean();

    const stuQuery = { _id: stuBusAtt.map((ele) => ele.student) };

    if (classes.length > 0) stuQuery.class = classes.map((ele) => ele._id);
    if (sections.length > 0) stuQuery.section = sections.map((ele) => ele._id);

    const stuFields = ["admission_no", "name", "email", "phone", "rfid"];

    const stuSearchQuery = UC.createSearchQuery(stuFields, search);
    stuQuery["$or"] = stuSearchQuery;

    const students = await Student.find(stuQuery).select("_id").lean();

    const fields = ["list.tag", "list.address", "list.msg"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
    query["$or"].push({ student: students.map((ele) => ele._id) });
  }

  const populateConfigs = [
    {
      path: "student",
      select: "admission_no name class section photo",
      populate: { path: "class section", select: "name" },
    },
    { path: "list.bus", select: "name" },
  ];

  const results = await UC.paginatedQueryProPlus(
    StuBusAtt,
    query,
    {},
    page,
    limit,
    sort,
    populateConfigs
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  const flattenedResults = results.result.map((item) => {
    const photo = item.student.photo
      ? `${DOMAIN}/uploads/student/${item.student.photo}`
      : `${DOMAIN}/user-blank.svg`;

    const flattenedData = {
      _id: item._id,
      date: UC.convAndFormatDT(item.date),
      // student_id: item.student._id,
      admission_no: item.student.admission_no,
      student_name: item.student.name,
      // class_id: item.student.class._id,
      class_name: item.student.class.name,
      // section_id: item.student.section._id,
      section_name: item.student.section.name,
      photo,
      last_bus: item?.bus?.name,
    };

    item.list.forEach((tagObj) => {
      const tagKey = tagObj.tag.toLowerCase();
      const tagName =
        tagObj.tag === C.M_ENTRY
          ? "Picked from Stoppage"
          : tagObj.tag === C.M_EXIT
          ? "Dropped at School"
          : tagObj.tag === C.A_ENTRY
          ? "Picked from School"
          : tagObj.tag === C.A_EXIT
          ? "Dropped at Stoppage"
          : C.UNKNOWN;

      flattenedData[`${tagKey}_tag`] = tagName;
      flattenedData[`${tagKey}_time`] = UC.convAndFormatDT(tagObj.time).slice(
        10
      );
      flattenedData[`${tagKey}_lat`] = tagObj.lat;
      flattenedData[`${tagKey}_lon`] = tagObj.lon;
      flattenedData[`${tagKey}_address`] = tagObj.address;
      flattenedData[`${tagKey}_msg`] = tagObj.msg;
    });

    // flattenedData.createdAt = item.createdAt;
    // flattenedData.updatedAt = item.updatedAt;

    return flattenedData;
  });

  delete results.result;
  results.result = flattenedResults;

  res.status(200).json(results);
});

// @desc    Get student's bus attendance
// @route   POST /api/student-info/attendance/bus
// @access  Private
const getBusAttendanceWithAbsent = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "-date";
  const sord = req.query.sord_order || "asc";
  const search = req.query.search;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");

  const dates = UC.getDatesArrayFromDateRange(dtStart, dtEnd);

  const totalBusAttendances = [];

  const query = {};
  const stuQuery = {};

  const busNames = req.body.bus_names;
  if (busNames && busNames.length > 0) {
    const busIds = await UC.validateBusesFromName(busNames);

    // query["list.bus"] = busIds;
    query.$or = [{ "list.bus": busIds }, { bus: busIds }];
    stuQuery.$or = [{ bus_pick: busIds }, { bus_drop: busIds }];
  }

  const classSectionNames = req.body.class_section_names;
  if (classSectionNames && classSectionNames.length > 0) {
    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      classSectionNames,
      req.ayear
    );

    stuQuery.class = classIds;
    stuQuery.section = secIds;
  }

  const tag = req.body.tag;
  if (tag) {
    if (tag === "total") {
    } else if (tag === "present") {
    } else if (tag === "absent") {
    } else if (tag === "mCheckIn") {
      query.list = { $elemMatch: { tag: C.M_ENTRY } };
    } else if (tag === "mCheckOut") {
      query.list = { $elemMatch: { tag: C.M_EXIT } };
    } else if (tag === "aCheckIn") {
      query.list = { $elemMatch: { tag: C.A_ENTRY } };
    } else if (tag === "aCheckOut") {
      query.list = { $elemMatch: { tag: C.A_EXIT } };
    } else if (tag === "mCheckInMissed") {
      query.list = { $not: { $elemMatch: { tag: C.M_ENTRY } } };
    } else if (tag === "mCheckOutMissed") {
      query.list = { $not: { $elemMatch: { tag: C.M_EXIT } } };
    } else if (tag === "aCheckInMissed") {
      query.list = { $not: { $elemMatch: { tag: C.A_ENTRY } } };
    } else if (tag === "aCheckOutMissed") {
      query.list = { $not: { $elemMatch: { tag: C.A_EXIT } } };
    } else if (tag === "inSchool") {
      query.list = {
        $elemMatch: { $or: [{ tag: C.M_ENTRY }, { tag: C.M_EXIT }] },
      };
    } else if (tag === "outSchool") {
      query.list = {
        $elemMatch: { $or: [{ tag: C.A_ENTRY }, { tag: C.A_EXIT }] },
      };
    } else if (tag === "inButNotOutSchool") {
      query.$and = [
        {
          list: {
            $elemMatch: { $or: [{ tag: C.M_ENTRY }, { tag: C.M_EXIT }] },
          },
        },
        {
          list: {
            $not: {
              $elemMatch: { $or: [{ tag: C.A_ENTRY }, { tag: C.A_EXIT }] },
            },
          },
        },
      ];
    } else if (tag === "wrongBus") {
    } else if (tag === "wrongStop") {
    } else {
      res.status(400);
      throw new Error("Invalid tag!");
    }
  }

  if (search) {
    const stuFields = ["admission_no", "name", "email", "phone", "rfid"];

    const stuSearchQuery = UC.createSearchQuery(stuFields, search);
    stuQuery["$or"] = stuSearchQuery;

    const fields = ["list.tag", "list.address", "list.msg"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const students = await Student.find(stuQuery).select("_id").lean();
  query.student = students.map((ele) => ele._id);

  for (const dt of dates) {
    query.date = dt;

    const busAttendances = await StuBusAtt.find(query)
      .populate({
        path: "student",
        select: "admission_no name class section photo",
        populate: { path: "class section", select: "name" },
      })
      .populate("bus", "name")
      .lean();

    const flattenedBusAtt = busAttendances.map((busAtt) => {
      const photo = busAtt.student.photo
        ? `${DOMAIN}/uploads/student/${busAtt.student.photo}`
        : `${DOMAIN}/user-blank.svg`;

      const flattenedData = {
        _id: busAtt._id,
        absent: false,
        date: UC.formatDate(busAtt.date),
        admission_no: busAtt.student.admission_no,
        student_name: busAtt.student.name,
        class_name: busAtt.student.class.name,
        section_name: busAtt.student.section.name,
        photo,
        last_bus: busAtt?.bus?.name,
      };

      busAtt.list.forEach((tagObj) => {
        const tagKey = tagObj.tag.toLowerCase();
        const tagName =
          tagObj.tag === C.M_ENTRY
            ? "Picked from Stoppage"
            : tagObj.tag === C.M_EXIT
            ? "Dropped at School"
            : tagObj.tag === C.A_ENTRY
            ? "Picked from School"
            : tagObj.tag === C.A_EXIT
            ? "Dropped at Stoppage"
            : C.UNKNOWN;

        flattenedData[`${tagKey}_tag`] = tagName;
        flattenedData[`${tagKey}_time`] = UC.convAndFormatDT(tagObj.time).slice(
          10
        );
        flattenedData[`${tagKey}_lat`] = tagObj.lat;
        flattenedData[`${tagKey}_lon`] = tagObj.lon;
        flattenedData[`${tagKey}_address`] = tagObj.address;
        flattenedData[`${tagKey}_msg`] = tagObj.msg;
      });

      return flattenedData;
    });

    stuQuery._id = { $nin: busAttendances.map((ele) => ele.student._id) };

    const absentStudents = await Student.find(stuQuery)
      .select("admission_no name")
      .populate("class section", "name")
      .lean();

    const absentBusAttendances = [];
    for (const abStu of absentStudents) {
      absentBusAttendances.push({
        absent: true,
        date: UC.convAndFormatDT(dt),
        admission_no: abStu.admission_no,
        student_name: abStu.name,
        class_name: abStu.class.name,
        section_name: abStu.section.name,
        photo: abStu.photo
          ? `${DOMAIN}/uploads/student/${abStu.photo}`
          : `${DOMAIN}/user-blank.svg`,
        mentry_tag: "NA",
        mentry_time: "NA",
        mentry_lat: 0,
        mentry_lon: 0,
        mentry_address: "NA",
        mentry_msg: "NA",
        mexit_tag: "NA",
        mexit_time: "NA",
        mexit_lat: 0,
        mexit_lon: 0,
        mexit_address: "NA",
        mexit_msg: "NA",
        aentry_tag: "NA",
        aentry_time: "NA",
        aentry_lat: 0,
        aentry_lon: 0,
        aentry_address: "NA",
        aentry_msg: "NA",
        aexit_tag: "NA",
        aexit_time: "NA",
        aexit_lat: 0,
        aexit_lon: 0,
        aexit_address: "NA",
        aexit_msg: "NA",
      });
    }

    if (!tag || tag === "total") {
      totalBusAttendances.push(...flattenedBusAtt, ...absentBusAttendances);
    } else if (tag === "absent") {
      totalBusAttendances.push(...absentBusAttendances);
    } else totalBusAttendances.push(...flattenedBusAtt);
  }

  const sortFn =
    sord === "desc"
      ? (a, b) => {
          if (a[sort] > b[sort]) return -1;
          if (a[sort] < b[sort]) return 1;
          return 0;
        }

      : (a, b) => {
          if (a[sort] > b[sort]) return 1;
          if (a[sort] < b[sort]) return -1;
          return 0;
        };

  const results = UC.paginatedArrayQuery(
    totalBusAttendances,
    page,
    limit,
    sortFn
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get student's bus attendance stats
// @route   POST /api/student-info/attendance/bus-stats
// @access  Private
const getBusAttendanceStats = asyncHandler(async (req, res) => {
  const date = UC.validateAndSetDate(req.body.date, "date");

  const dtStart = new Date(new Date(date).setUTCHours(18, 30, 0, 0) - 86400000);
  const dtEnd = new Date(new Date(date).setUTCHours(18, 29, 59, 999));

  const query = { date: { $gte: dtStart, $lte: dtEnd } };
  const stuQuery = {
    academic_year: req.ayear,
    bus_pick: { $type: "objectId" },
  };

  const busNames = req.body.bus_names;
  if (busNames && busNames.length > 0) {
    const busIds = await UC.validateBusesFromName(busNames);

    query.$or = [{ "list.bus": busIds }, { bus: busIds }];
    stuQuery["$or"] = [{ bus_pick: busIds }, { bus_drop: busIds }];
  }

  const attendance = await StuBusAtt.find(query)
    .populate("student", "bus_pick bus_drop bus_stop")
    .lean();

  const total = await Student.countDocuments(stuQuery);
  const present = attendance.length;
  const absent = total - present;

  // return res.json(attendance);

  const mCheckIn = attendance.filter((att) =>
    att.list.some((entry) => entry.tag === C.M_ENTRY)
  ).length;

  const mCheckOut = attendance.filter((att) =>
    att.list.some((ele) => ele.tag === C.M_EXIT)
  ).length;
  const aCheckIn = attendance.filter((att) =>
    att.list.some((ele) => ele.tag === C.A_ENTRY)
  ).length;
  const aCheckOut = attendance.filter((att) =>
    att.list.some((ele) => ele.tag === C.A_EXIT)
  ).length;

  const mCheckInMissed = attendance.filter(
    (att) => !att.list.some((entry) => entry.tag === C.M_ENTRY)
  ).length;
  const mCheckOutMissed = attendance.filter(
    (att) => !att.list.some((ele) => ele.tag === C.M_EXIT)
  ).length;
  const aCheckInMissed = attendance.filter(
    (att) => !att.list.some((ele) => ele.tag === C.A_ENTRY)
  ).length;
  const aCheckOutMissed = attendance.filter(
    (att) => !att.list.some((ele) => ele.tag === C.A_EXIT)
  ).length;

  const inSchool = attendance.filter((att) =>
    att.list.some((entry) => [C.M_ENTRY, C.M_EXIT].includes(entry.tag))
  ).length;

  const outSchool = attendance.filter((att) =>
    att.list.some((entry) => [C.A_ENTRY, C.A_EXIT].includes(entry.tag))
  ).length;

  const inButNotOutSchool = inSchool - outSchool;

  const wrongBus = attendance.filter((att) => {
    // console.log(att);
  }).length;

  const wrongStop = attendance.filter((att) => {
    // console.log(att);
  }).length;

  const result = {
    from: new Date(new Date(dtStart).toISOString().replace("Z", "-05:30")),
    to: new Date(new Date(dtEnd).toISOString().replace("Z", "-05:30")),
    total,
    present,
    absent,
    mCheckIn,
    mCheckOut,
    aCheckIn,
    aCheckOut,
    mCheckInMissed,
    mCheckOutMissed,
    aCheckInMissed,
    aCheckOutMissed,
    inSchool,
    outSchool,
    inButNotOutSchool,
    wrongBus,
    wrongStop,
  };

  res.status(200).json(result);
});

// @desc    Get student's class attendance
// @route   POST /api/student-info/attendance/class
// @access  Private
const getClassAttendance_old = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "date";
  const search = req.query.search;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");

  const query = { date: { $gte: dtStart, $lt: dtEnd } };

  const tag = req.body.tag;
  if (tag) {
    if (tag === "total") {
    } else if (tag === "present") {
      query.$expr = {
        $gt: [{ $size: "$list" }, 0],
      };
    } else if (tag === "absent") {
      query.$or = [{ list: { $exists: false } }, { list: { $size: 0 } }];
    } else if (tag === "checkIn") {
      query.list = { $elemMatch: { tag: C.ENTRY } };
    } else if (tag === "checkOut") {
      query.list = { $elemMatch: { tag: C.EXIT } };
    } else if (tag === "checkInButNotOut") {
      query.list = {
        $elemMatch: { tag: C.ENTRY },
        $not: { $elemMatch: { tag: C.EXIT } },
      };
    } else if (tag === "checkInMissed") {
      query.list = { $not: { $elemMatch: { tag: C.ENTRY } } };
    } else if (tag === "checkOutMissed") {
      query.list = { $not: { $elemMatch: { tag: C.EXIT } } };
    } else {
      res.status(400);
      throw new Error("Invalid tag!");
    }
  }

  // Fetch class attendance to get students we want to query
  const stuClassAtt = await StuClassAtt.find(query).select("student").lean();

  const stuQuery = { _id: stuClassAtt.map((ele) => ele.student) };

  const classSectionNames = req.body.class_section_names;
  if (classSectionNames && classSectionNames.length > 0) {
    const classNames = [];
    const sectionNames = [];

    for (const name of classSectionNames) {
      // class-name , section-stream-name
      const [cName, ssName] = name.split("-");

      const classAndStream = `${cName}${ssName.slice(1)}`;
      const sectionName = ssName[0];
      if (!classNames.includes(classAndStream)) classNames.push(classAndStream);
      if (!sectionNames.includes(sectionName)) sectionNames.push(sectionName);
    }

    const classIds = await UC.validateClassesFromName(classNames, req.ayear);
    const secIds = await UC.validateSectionsFromName(sectionNames, req.ayear);

    stuQuery.class = classIds;
    stuQuery.section = secIds;
  }

  const students = await Student.find(stuQuery).select("_id").lean();

  query.student = students.map((s) => s._id);

  if (search) {
    const stuFields = ["admission_no", "name", "email", "phone", "rfid"];

    const stuSearchQuery = UC.createSearchQuery(stuFields, search);
    stuQuery["$or"] = stuSearchQuery;

    const students = await Student.find(stuQuery).select("_id").lean();

    const fields = ["list.tag", "list.msg"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
    query["$or"].push({ student: students.map((ele) => ele._id) });
  }

  const populateConfigs = [
    {
      path: "student",
      select: "admission_no name class section photo",
      populate: { path: "class section", select: "name" },
    },
  ];

  const results = await UC.paginatedQueryProPlus(
    StuClassAtt,
    query,
    {},
    page,
    limit,
    sort,
    populateConfigs
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  const flattenedResults = results.result.map((item) => {
    const photo = item.student.photo
      ? `${DOMAIN}/uploads/student/${item.student.photo}`
      : `${DOMAIN}/user-blank.svg`;

    const flattenedData = {
      _id: item._id,
      date: UC.convAndFormatDT(item.date),
      // student_id: item.student._id,
      admission_no: item.student.admission_no,
      student_name: item.student.name,
      // class_id: item.student.class._id,
      class_name: item.student.class.name,
      // section_id: item.student.section._id,
      section_name: item.student.section.name,
      photo,
      last_bus: item?.bus?.name,
    };

    item.list.forEach((tagObj) => {
      const tagKey = tagObj.tag.toLowerCase();

      flattenedData[`${tagKey}_tag`] = tagObj.tag;
      flattenedData[`${tagKey}_time`] = UC.convAndFormatDT(tagObj.time).slice(
        10
      );
      flattenedData[`${tagKey}_msg`] = tagObj.msg;
      flattenedData[`${tagKey}_mark_as_absent`] = tagObj.mark_as_absent;
    });

    // flattenedData.createdAt = item.createdAt;
    // flattenedData.updatedAt = item.updatedAt;

    return flattenedData;
  });

  delete results.result;
  results.result = flattenedResults;

  // for (const result of results.result) {
  //   const photo = result.student.photo;
  //   result.photo = `${DOMAIN}/uploads/student/${photo}`;

  //   delete result.student.photo;

  //   for (const list of result.list) {
  //     list.time = UC.convUTCTo0530(list.time);
  //   }
  // }

  res.status(200).json(results);
});

// @desc    Get student's class attendance
// @route   POST /api/student-info/attendance/class
// @access  Private
const getClassAttendanceWithAbsent = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "date";
  const sord = req.query.sort_order || "asc";
  const search = req.query.search;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");

  const dates = UC.getDatesArrayFromDateRange(dtStart, dtEnd);

  const totalClassAttendances = [];

  const query = {};
  const stuQuery = {};

  const tag = req.body.tag;
  if (tag) {
    if (tag === "total") {
    } else if (tag === "present") {
    } else if (tag === "absent") {
    } else if (tag === "checkIn") {
      query.list = { $elemMatch: { tag: C.ENTRY } };
    } else if (tag === "checkOut") {
      query.list = { $elemMatch: { tag: C.EXIT } };
    } else if (tag === "checkInButNotOut") {
      query.list = {
        $elemMatch: { tag: C.ENTRY },
        $not: { $elemMatch: { tag: C.EXIT } },
      };
    } else if (tag === "checkInMissed") {
      query.list = { $not: { $elemMatch: { tag: C.ENTRY } } };
    } else if (tag === "checkOutMissed") {
      query.list = { $not: { $elemMatch: { tag: C.EXIT } } };
    } else {
      res.status(400);
      throw new Error("Invalid tag!");
    }
  }

  const classSectionNames = req.body.class_section_names;
  if (classSectionNames && classSectionNames.length > 0) {
    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      classSectionNames,
      req.ayear
    );

    stuQuery.class = classIds;
    stuQuery.section = secIds;
  }

  if (search) {
    const stuFields = ["admission_no", "name", "email", "phone", "rfid"];

    const stuSearchQuery = UC.createSearchQuery(stuFields, search);
    stuQuery["$or"] = stuSearchQuery;

    const fields = ["list.tag", "list.msg"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const students = await Student.find(stuQuery).select("_id").lean();
  query.student = students.map((s) => s._id);

  for (const dt of dates) {
    query.date = dt;

    const classAttendances = await StuClassAtt.find(query)
      .populate({
        path: "student",
        select: "admission_no name class section photo",
        populate: { path: "class section", select: "name" },
      })
      .lean();

    const flattenedClassAtt = classAttendances.map((item) => {
      const photo = item.student.photo
        ? `${DOMAIN}/uploads/student/${item.student.photo}`
        : `${DOMAIN}/user-blank.svg`;

      const flattenedData = {
        _id: item._id,
        absent: false,
        date: UC.formatDate(item.date),
        admission_no: item.student.admission_no,
        student_name: item.student.name,
        class_name: item.student.class.name,
        section_name: item.student.section.name,
        photo,
        last_bus: item?.bus?.name,
      };

      item.list.forEach((tagObj) => {
        const tagKey = tagObj.tag.toLowerCase();
        const tagName =
          tagObj.tag === C.ENTRY
            ? "Checked in to School"
            : tagObj.tag === C.EXIT
            ? "Checked out from School"
            : "Unknown";

        flattenedData[`${tagKey}_tag`] = tagName;
        flattenedData[`${tagKey}_time`] = UC.convAndFormatDT(tagObj.time).slice(
          10
        );
        flattenedData[`${tagKey}_msg`] = tagObj.msg;
        flattenedData[`${tagKey}_mark_as_absent`] = tagObj.mark_as_absent;
      });

      return flattenedData;
    });

    stuQuery._id = { $nin: classAttendances.map((ele) => ele.student._id) };

    const absentStudents = await Student.find(stuQuery)
      .select("admission_no name")
      .populate("class section", "name")
      .lean();

    const absentBusAttendances = [];
    for (const abStu of absentStudents) {
      absentBusAttendances.push({
        absent: true,
        date: UC.convAndFormatDT(dt),
        admission_no: abStu.admission_no,
        student_name: abStu.name,
        class_name: abStu.class.name,
        section_name: abStu.section.name,
        photo: abStu.photo
          ? `${DOMAIN}/uploads/student/${abStu.photo}`
          : `${DOMAIN}/user-blank.svg`,
        entry_tag: "NA",
        entry_time: "NA",
        entry_lat: 0,
        entry_lon: 0,
        entry_address: "NA",
        entry_msg: "NA",
        exit_tag: "NA",
        exit_time: "NA",
        exit_lat: 0,
        exit_lon: 0,
        exit_address: "NA",
        exit_msg: "NA",
      });
    }

    if (!tag || tag === "total") {
      totalClassAttendances.push(...flattenedClassAtt, ...absentBusAttendances);
    } else if (tag === "absent") {
      totalClassAttendances.push(...absentBusAttendances);
    } else totalClassAttendances.push(...flattenedClassAtt);
  }

  const sortFn =
    sord === "desc"
      ? (a, b) => {
          if (a[sort] > b[sort]) return -1;
          if (a[sort] < b[sort]) return 1;
          return 0;
        }

      : (a, b) => {
          if (a[sort] > b[sort]) return 1;
          if (a[sort] < b[sort]) return -1;
          return 0;
        };

  const results = UC.paginatedArrayQuery(
    totalClassAttendances,
    page,
    limit,
    sortFn
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get student's class attendance stats
// @route   POST /api/student-info/attendance/class-stats
// @access  Private
const getClassAttendanceStats = asyncHandler(async (req, res) => {
  const date = UC.validateAndSetDate(req.body.date, "date");

  const dtStart = new Date(new Date(date).setUTCHours(18, 30, 0, 0) - 86400000);
  const dtEnd = new Date(new Date(date).setUTCHours(18, 29, 59, 999));

  const query = { date: { $gte: dtStart, $lte: dtEnd } };
  const stuQuery = { academic_year: req.ayear };

  const classSectionNames = req.body.class_section_names;
  if (classSectionNames && classSectionNames.length > 0) {
    const classNames = [];
    const sectionNames = [];

    for (const name of classSectionNames) {
      // class-name , section-stream-name
      const [cName, ssName] = name.split("-");

      const classAndStream = `${cName}${ssName.slice(1)}`;
      const sectionName = ssName[0];
      if (!classNames.includes(classAndStream)) classNames.push(classAndStream);
      if (!sectionNames.includes(sectionName)) sectionNames.push(sectionName);
    }

    const classIds = await UC.validateClassesFromName(classNames, req.ayear);
    const secIds = await UC.validateSectionsFromName(sectionNames, req.ayear);

    stuQuery.class = classIds;
    stuQuery.section = secIds;
  }

  const students = await Student.find(stuQuery).select("_id").lean();

  query.student = students.map((ele) => ele._id);

  const attendances = await StuClassAtt.find(query)
    .populate("student", "class section")
    .lean();

  let attendance = attendances;

  const total = students.length;
  const present = attendance.length;
  const absent = total - present;
  const checkIn = attendance.filter((att) =>
    att.list.some((ele) => ele.tag === C.ENTRY)
  ).length;
  const checkOut = attendance.filter((att) =>
    att.list.some((ele) => ele.tag === C.EXIT)
  ).length;
  const checkInButNotOut = checkIn - checkOut;
  const checkInMissed = attendance.filter(
    (att) => !att.list.some((ele) => ele.tag === C.ENTRY)
  ).length;
  const checkOutMissed = attendance.filter(
    (att) => !att.list.some((ele) => ele.tag === C.EXIT)
  ).length;

  const result = {
    from: new Date(new Date(dtStart).toISOString().replace("Z", "-05:30")),
    to: new Date(new Date(dtEnd).toISOString().replace("Z", "-05:30")),
    total,
    present,
    absent,
    checkIn,
    checkOut,
    checkInButNotOut,
    checkInMissed,
    checkOutMissed,
  };

  res.status(200).json(result);
});

// @desc    Get student's attendance status
// @route   POST /api/student-info/attendance/status
// @access  Private
const getStudentAttendanceToday = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "admission_no";
  const search = req.query.search;

  // const dtStart = new Date("2024-07-29T18:30:00Z");
  // const dtEnd = new Date("2024-07-30T18:30:00Z");

  const dtStart = new Date();
  const dtEnd = new Date();

  dtStart.setHours(0, 0, 0, 0);
  dtEnd.setHours(23, 59, 59, 999);

  const query = { date: { $gt: dtStart, $lte: dtEnd } };
  const stuQuery = {};

  const classSectionNames = req.body.class_section_names;
  if (classSectionNames && classSectionNames.length > 0) {
    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      classSectionNames,
      req.ayear
    );

    stuQuery.class = classIds;
    stuQuery.section = secIds;
  }

  if (search) {
    const stuFields = ["admission_no", "name", "email", "phone", "rfid"];

    const stuSearchQuery = UC.createSearchQuery(stuFields, search);
    stuQuery["$or"] = stuSearchQuery;

    const fields = ["list.tag", "list.msg"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const students = await Student.find(stuQuery).select("_id").lean();

  const populateConfigs = [
    { path: "class section stream boarding_type", select: "name" },
  ];

  const results = await UC.paginatedQueryProPlus(
    Student,
    stuQuery,
    "admission_no name roll_no",
    page,
    limit,
    sort,
    populateConfigs
  );

  query.student = students.map((s) => s._id);

  const classAttendances = await StuClassAtt.find(query)
    .select("student list")
    .lean();
  const busAttendances = await StuBusAtt.find(query)
    .select("student list")
    .lean();

  for (const item of results.result) {
    item.class = item.class.name;
    item.section = item.section.name;
    item.stream = item.stream.name;
    item.boarding_type = item.boarding_type.name;

    const classAtt = classAttendances.find((ele) =>
      ele.student.equals(item._id)
    );

    if (classAtt) {
      const classAttMsg = classAtt.list.reduce((acc, ele) => {
        const tag = ele.tag.toUpperCase();
        const time = UC.convAndFormatDT(ele.time).slice(10);
        if (acc === "") return `${tag}: ${time}`;
        return `${acc} | ${tag}: ${time}`;
      }, "");

      item.class_attendance = classAttMsg;
    } else item.class_attendance = false;

    const busAtt = busAttendances.find((ele) => ele.student.equals(item._id));

    if (busAtt) {
      const busAttMsg = busAtt.list.reduce((acc, ele) => {
        const tag = ele.tag.toUpperCase();
        const time = UC.convAndFormatDT(ele.time).slice(10);
        if (acc === "") return `${tag}: ${time}`;
        return `${acc} | ${tag}: ${time}`;
      }, "");

      item.bus_attendance = busAttMsg;
    } else item.bus_attendance = false;
  }

  return res.json(results);
});

// @desc    Get students notification
// @route   POST /api/student-info/student-notification
// @access  Private
const getStudentNotification = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "date";
  const search = req.query.search;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");
  const notyType = req.body.notification_type;

  const stuQuery = {};

  const classSectionNames = req.body.class_section_names;
  if (classSectionNames && classSectionNames.length > 0) {
    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      classSectionNames,
      req.ayear
    );

    stuQuery.class = classIds;
    stuQuery.section = secIds;
  }

  if (req.body.bus_names && req.body.bus_names.length > 0) {
    const busIds = await UC.validateBusesFromName(req.body.bus_names);

    stuQuery["$or"] = [{ bus_pick: busIds }, { bus_drop: busIds }];
  }

  const students = await Student.find(stuQuery)
    .select("_id admission_no name")
    .lean();

  const query = {
    createdAt: { $gte: dtStart, $lte: dtEnd },
    student: students.map((s) => s._id),
  };

  if (notyType) query.type = notyType;

  if (search) {
    const fields = ["type"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const populateConfigs = [
    {
      path: "student",
      select: "admission_no name email",
      populate: { path: "class section bus_pick bus_drop", select: "name" },
    },
  ];

  const results = await UC.paginatedQueryProPlus(
    StudentNotification,
    query,
    {},
    page,
    limit,
    sort,
    populateConfigs
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  results.result = results.result.map((item) => {
    return {
      admission_no: item.student.admission_no,
      name: item.student.name,
      class: item.student.class.name,
      section: item.student.section.name,
      class: item.student.class.name,
      email: item.student.email,
      bus_drop: item.student.bus_drop.name,
      bus_pick: item.student.bus_pick.name,
      msg: item.msg,
      createdAt: UC.convAndFormatDT(item.createdAt),
    };
  });

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
  deleteStudent,
  bulkOpsStudent,

  getBusAttendance_old,
  getBusAttendanceWithAbsent,
  getBusAttendanceStats,
  getClassAttendance_old,
  getClassAttendanceWithAbsent,
  getClassAttendanceStats,
  getStudentAttendanceToday,

  getStudentNotification,
};
