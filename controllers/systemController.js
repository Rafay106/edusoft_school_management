const fs = require("node:fs");
const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const School = require("../models/system/schoolModel");
const User = require("../models/system/userModel");
const TemplatePrivilege = require("../models/system/templatePrivilegeModel");
const Student = require("../models/studentInfo/studentModel");

const init = asyncHandler(async (req, res) => {
  const key = req.body.key;

  if (await User.any({ type: C.SUPERADMIN })) {
    res.status(400);
    throw new Error("Superadmin already exists");
  }

  if (key !== process.env.SECRET) {
    res.status(400);
    throw new Error("Invalid Key");
  }

  // Superadmin
  const templatePrivilege = await TemplatePrivilege.create({
    type: C.SUPERADMIN,
    privileges: {
      sidebar_manager: true,
      dashboard: {
        no_of_students: true,
        no_of_teacher: true,
        no_of_parents: true,
        no_of_staff: true,
        cmiaec: true,
        cyiaec: true,
        notice_board: true,
        calender_section: true,
        to_do_list: true,
      },
      admin_section: {
        admission_query: { add: true, edit: true, delete: true },
        visitor_book: { add: true, edit: true, delete: true, download: true },
        complaint: { add: true, edit: true, delete: true, download: true },
        postal_receive: {
          add: true,
          edit: true,
          delete: true,
          download: true,
        },
        postal_dispatch: {
          add: true,
          edit: true,
          delete: true,
          download: true,
        },
        phone_call_log: { add: true, edit: true, delete: true },
        admin_setup: { add: true, edit: true, delete: true },
        student_id_card: { add: true, edit: true, delete: true },
        generate_certificate: true,
        generate_id_card: true,
      },
      sutdent_info: {
        category: { add: true, edit: true, delete: true },
        add: true,
        list: {
          add: true,
          edit: true,
          delete: true,
          assign_class: true,
          show_all: true,
        },
        multi_class: true,
        delete_record: true,
        unassign: true,
        attendance: { add: true },
        group: { add: true, edit: true, delete: true },
        promote: { add: true },
        disabled: { search: true, enable: true, delete: true },
        subject_wise_attendance: { save: true },
        export: { to_csv: true, to_pdf: true },
        time_setup: true,
      },
      academics: {
        optional_subject: true,
        section: { add: true, edit: true, delete: true },
        class: { add: true, edit: true, delete: true },
        subjects: { add: true, edit: true, delete: true },
        assign_class_teacher: { add: true, edit: true, delete: true },
        assign_subject: { add: true, view: true },
        class_room: { add: true, edit: true, delete: true },
        class_routine: { add: true, delete: true },
        teacher_class_routine: true,
      },
      download_center: {
        content_type: { add: true, edit: true, update: true, delete: true },
        content_list: {
          add: true,
          edit: true,
          update: true,
          delete: true,
          search: true,
        },
        shared_content_list: { add: true, generate_link: true },
        video_list: { add: true, update: true, delete: true, search: true },
      },
      study_material: {
        upload_content: {
          add: true,
          download: true,
          delete: true,
          edit: true,
        },
        assignment: { edit: true, download: true, delete: true },
        syllabus: { edit: true, download: true, delete: true },
        other_downloads: { download: true, delete: true, edit: true },
      },
      lesson_plan: {
        lesson: { add: true, edit: true, delete: true },
        topic: { add: true, edit: true, delete: true },
        topic_overview: true,
        lesson_plan: { add: true, edit: true, delete: true, view: true },
        my_lesson_plan: true,
        my_lesson_plan_overview: true,
        lesson_plan_overview: true,
      },
      fees_settings: {
        fee_invoic_settings: { update: true },
      },
      exam_settings: {
        format_settings: true,
        setup_exam_rule: true,
        position_setup: true,
        all_exam_position: true,
        exam_signature_settings: true,
        admit_card_setting: true,
        seat_plan_setting: true,
      },
      student_report: {},
      exam_report: {},
      staff_report: {},
      fees_report: {},
      accounts_report: {},
      fees: {},
      wallet: {},
      bulk_print: {},
      accounts: {},
      human_resource: {},
      leave: {},
      teacher_evaluation: {},
      custom_field: {},
      chat: {},
      examination: {},
      exam_plan: {},
      online_exam: {},
      behaviour_records: {},
      homework: {},
      communicate: {},
      library: {},
      inventory: {},
      transport: {},
      dormitory: {},
      role_and_permissions: {},
      general_settings: {},
      style: {},
      frontend_cms: {},
    },
  });

  // Admin
  await TemplatePrivilege.create({
    type: C.ADMIN,
    privileges: {},
  });

  // Manager
  await TemplatePrivilege.create({
    type: C.MANAGER,
    privileges: {},
  });

  // School
  await TemplatePrivilege.create({
    type: C.SCHOOL,
    privileges: {},
  });

  // Teacher
  await TemplatePrivilege.create({
    type: C.TEACHER,
    privileges: {},
  });

  // Parent
  await TemplatePrivilege.create({
    type: C.PARENT,
    privileges: {},
  });

  // Student
  await TemplatePrivilege.create({
    type: C.STUDENT,
    privileges: {},
  });

  // Accountant
  await TemplatePrivilege.create({
    type: C.ACCOUNTANT,
    privileges: {},
  });

  // Bus Staff
  await TemplatePrivilege.create({
    type: C.BUS_STAFF,
    privileges: {},
  });

  // Librarian
  await TemplatePrivilege.create({
    type: C.LIBRARIAN,
    privileges: {},
  });

  // Receptionist
  await TemplatePrivilege.create({
    type: C.RECEPTIONIST,
    privileges: {},
  });

  const superadmin = await User.create({
    email: req.body.email,
    password: req.body.password,
    username: UC.getUsernameFromEmail(req.body.email),
    name: req.body.name,
    phone: req.body.phone,
    type: C.SUPERADMIN,
    privileges: templatePrivilege.privileges,
  });

  res.status(201).json({ success: true, msg: superadmin._id });
});

/** 1. TemplatePrivilege */

// @desc    Get TemplatePrivileges
// @route   GET /api/system/template-privilege
// @access  Private
const getTemplatePrivileges = asyncHandler(async (req, res) => {
  const privileges = await TemplatePrivilege.find().lean();

  res.status(200).json(privileges);
});

// @desc    Get a TemplatePrivilege
// @route   GET /api/system/template-privilege/:id
// @access  Private
const getTemplatePrivilege = asyncHandler(async (req, res) => {
  const template = await TemplatePrivilege.findOne({
    _id: req.params.id,
  }).lean();

  if (!template) {
    res.status(404);
    throw new Error(C.getResourse404Error("TemplatePrivilege", req.params.id));
  }

  res.status(200).json(template);
});

// @desc    Create a TemplatePrivilege
// @route   POST /api/system/template-privilege
// @access  Private
const createTemplatePrivilege = asyncHandler(async (req, res) => {
  const template = await TemplatePrivilege.create(req.body);

  res.status(201).json({ msg: template._id });
});

// @desc    Update a TemplatePrivilege
// @route   PATCH /api/system/template-privilege/:id
// @access  Private
const updateTemplatePrivilege = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await TemplatePrivilege.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("TemplatePrivilege", req.params.id));
  }

  const result = await TemplatePrivilege.updateOne(query, { $set: req.body });

  res.status(200).json(result);
});

// @desc    Delete a TemplatePrivilege
// @route   DELETE /api/system/template-privilege/:id
// @access  Private
const deleteTemplatePrivilege = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const result = await TemplatePrivilege.deleteOne(query);

  res.status(200).json(result);
});

/** 2. User */

// @desc    Get Users
// @route   GET /api/system/user
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "email";
  const searchField = req.query.sf;
  const searchValue = req.query.sv;

  const query = {};

  if (C.isManager(req.user.type)) query.manager = req.user._id;
  else if (C.isSchool(req.user.type)) query.school = req.user._id;

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = ["email", "name", "mobile", "type"];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  const select = "email name mobile type";

  const results = await UC.paginatedQuery(
    User,
    query,
    select,
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a User
// @route   GET /api/system/user/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isManager(req.user.type)) query.manager = req.user._id;
  else if (C.isSchool(req.user.type)) query.school = req.user._id;

  const user = await User.findOne(query)
    .select("-password")
    .populate("manager school", "name")
    .lean();

  if (!user) {
    res.status(404);
    throw new Error(C.getResourse404Error("User", req.params.id));
  }

  res.status(200).json(user);
});

// @desc    Get required data to create a user
// @route   GET /api/system/user/required-data
// @access  Private
const requiredDataUser = asyncHandler(async (req, res) => {
  const type = [
    C.TEACHER,
    C.PARENT,
    C.STUDENT,
    C.ACCOUNTANT,
    C.BUS_STAFF,
    C.LIBRARIAN,
    C.RECEPTIONIST,
  ];

  if (C.isManager(req.user.type)) {
    type.push(C.SCHOOL);
  } else if (C.isAdmin(req.user.type)) {
    type.push(C.SCHOOL, C.MANAGER);
  } else if (C.isSuperAdmin(req.user.type)) {
    type.push(C.MANAGER, C.ADMIN, C.SUPERADMIN);
  }

  res.status(200).json({ type: type.sort() });
});

// @desc    Create a User
// @route   POST /api/system/user
// @access  Private
const createUser = asyncHandler(async (req, res) => {
  const { email, name, phone, type } = req.body;
  let manager = req.body.manager;
  let school = req.body.school;

  // Validate type
  const notType = [C.SUPERADMIN, C.ADMIN];
  if (C.isAdmin(req.user.type)) {
    if (notType.includes(type)) {
      res.status(400);
      throw new Error(C.getValueNotSup(type));
    }
  } else if (C.isManager(req.user.type)) {
    manager = req.user._id;
    notType.push(C.MANAGER);
    if (notType.includes(type)) {
      res.status(400);
      throw new Error(C.getValueNotSup(type));
    }
  } else if (C.isSchool(req.user.type)) {
    manager = req.user.manager;
    school = req.user._id;
    notType.push(C.SCHOOL);
    if (notType.includes(type)) {
      res.status(400);
      throw new Error(C.getValueNotSup(type));
    }
  }

  // Validate manager
  if (
    C.isAdmins(req.user.type) &&
    ![C.SUPERADMIN, C.ADMIN, C.MANAGER].includes(type)
  ) {
    if (!manager) {
      res.status(400);
      throw new Error(C.getFieldIsReq("manager"));
    }

    if (!(await User.any({ _id: manager, type: C.MANAGER }))) {
      res.status(400);
      throw new Error(C.getResourse404Error("manager", manager));
    }
  }

  // Validate school
  if (
    (C.isAdmins(req.user.type) || C.isManager(req.user.type)) &&
    ![C.SUPERADMIN, C.ADMIN, C.MANAGER, C.SCHOOL].includes(type)
  ) {
    if (!school) {
      res.status(400);
      throw new Error(C.getFieldIsReq("school"));
    }

    if (!(await User.any({ _id: school, type: C.SCHOOL }))) {
      res.status(400);
      throw new Error(C.getResourse404Error("school", school));
    }
  }

  // Get privileges
  const privileges = await TemplatePrivilege.findOne({ type }).lean();

  const user = await User.create({
    email,
    password: "123456",
    username: UC.getUsernameFromEmail(email),
    name,
    phone,
    type,
    privileges,
    manager,
    school,
  });

  res.status(201).json({ msg: user._id });
});

// @desc    Update a User
// @route   PATCH /api/system/user/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const user = await User.findOne(query);

  // Admin can not update superadmin
  if (!user || (C.isAdmin(req.user.type) && C.isSuperAdmin(user.type))) {
    res.status(404);
    throw new Error(C.getResourse404Error("User", req.params.id));
  }

  const result = await User.updateOne(query, {
    $set: {
      email: req.body.email,
      username: req.body.username,
      name: req.body.name,
      phone: req.body.phone,
      privileges: req.body.privileges,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a user
// @route   DELETE /api/system/user/:id
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("type").lean();

  if (!user) {
    res.status(400);
    throw new Error(C.getResourse404Error("User", req.params.id));
  }

  const query = {};

  if (C.isSuperAdmin(user.type)) {
    res.status(400);
    throw new Error(`Can not delete ${C.SUPERADMIN}!`);
  }

  if (C.isManager(user.type)) query.manager = user._id;
  else if (C.isSchool(user.type)) query.school = user._id;

  if (await School.any(query)) {
    res.status(400);
    throw new Error("Unable to delete: User assigned to a School");
  }

  if (await Student.any(query)) {
    res.status(400);
    throw new Error("Unable to delete: User assigned to a Student");
  }

  const result = await User.deleteOne({ _id: req.params.id });

  res.status(200).json(result);
});

/** 3. School */

// @desc    Get all schools
// @route   GET /api/system/school
// @access  Private
const getSchools = asyncHandler(async (req, res) => {
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
      const fields = [
        "name",
        "email",
        "phone",
        "address",
        "country",
        "state",
        "city",
        "pincode",
      ];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  const results = await UC.paginatedQuery(
    School,
    query,
    "name email phone address",
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a school
// @route   GET /api/system/school/:id
// @access  Private
const getSchool = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isManager(req.user.type)) query.manager = req.user._id;
  else if (C.isSchool(req.user.type)) query.school = req.user._id;

  const school = await School.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!school) {
    res.status(404);
    throw new Error(C.getResourse404Error("School", req.params.id));
  }

  res.status(200).json(school);
});

// @desc    Add a school
// @route   POST /api/system/school
// @access  Private
const addSchool = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;

  if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await User.any({ _id: manager, type: C.MANAGER }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await User.any({ _id: school, type: C.SCHOOL }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const school_ = await School.create({
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
    timings: req.body.timings,
    manager: req.body.manager,
    school: req.body.school,
  });

  res.status(201).json({ msg: school_._id });
});

// @desc    Update a school
// @route   PUT /api/system/school/:id
// @access  Private
const updateSchool = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await School.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Error("School", req.params.id));
  }

  const lat = req.body.lat ? parseFloat(req.body.lat).toFixed(6) : undefined;
  const lon = req.body.lon ? parseFloat(req.body.lon).toFixed(6) : undefined;

  const result = await School.updateOne(query, {
    $set: {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      pincode: req.body.pincode,
      lat,
      lon,
      radius: req.body.radius,
      "timings.morning": req.body.timings?.morning,
      "timings.afternoon": req.body.timings?.afternoon,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a school
// @route   DELETE /api/system/school/:id
// @access  Private
const deleteSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id)
    .select("_id school")
    .lean();

  if (!school) {
    res.status(400);
    throw new Error(C.getResourse404Error("School", req.params.id));
  }

  const query = {};

  if (await Student.any({ school: school.school })) {
    res.status(400);
    throw new Error("Unable to delete: School assigned to Student");
  }

  const delQuery = { _id: req.params.id };

  if (C.isManager(req.user.type)) query.manager = req.user._id;

  const result = await School.deleteOne(delQuery);

  res.status(200).json(result);
});

// TODO
// @desc    Bulk operations for school
// @route   POST /api/system/school/bulk
// @access  Private
const bulkOpsSchool = asyncHandler(async (req, res) => {
  const cmd = req.body.cmd;
  const schools = req.body.schools;

  if (!cmd) {
    res.status(400);
    throw new Error("cmd is required!");
  }

  if (cmd === "import") {
    const fileData = JSON.parse(req.file.buffer.toString("utf8"));

    const result = await UC.addMultipleSchools(req.user._id, fileData);

    if (result.status === 400) {
      res.status(result.status);
      throw new Error(result.body);
    }

    return res.status(200).json({ msg: result.msg });
  }

  if (!schools) {
    res.status(400);
    throw new Error(C.getFieldIsReq("schools"));
  }

  if (schools.length === 0) {
    res.status(400);
    throw new Error("schools array is empty!");
  }

  const query = [C.SUPERADMIN, C.ADMIN].includes
    ? { _id: schools }
    : { _id: schools, manager: req.user._id };

  if (cmd === "delete") {
    const result = await School.deleteMany(query);

    return res.status(200).json(result);
  } else if (cmd === "export-json") {
    const schoolsToExport = await School.find(query)
      .select("-createdAt -updatedAt")
      .sort("name")
      .lean();

    const dt = new Date();
    const Y = String(dt.getUTCFullYear()).padStart(2, "0");
    const M = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const D = String(dt.getUTCDate()).padStart(2, "0");

    const fileName = `School_${Y}-${M}-${D}.json`;
    const fileDir = path.join(getAppRootDir(__dirname), "temp", fileName);

    fs.writeFileSync(fileDir, JSON.stringify(schoolsToExport));

    return res.download(fileDir, fileName, () => {
      fs.unlinkSync(fileDir);
    });
  } else {
    res.status(400);
    throw new Error("cmd not found!");
  }
});

module.exports = {
  init,

  getTemplatePrivileges,
  getTemplatePrivilege,
  createTemplatePrivilege,
  updateTemplatePrivilege,
  deleteTemplatePrivilege,

  getUsers,
  getUser,
  requiredDataUser,
  createUser,
  updateUser,
  deleteUser,

  getSchools,
  getSchool,
  addSchool,
  updateSchool,
  deleteSchool,
  bulkOpsSchool,
};
