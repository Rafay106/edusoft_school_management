const fs = require("node:fs");
const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const School = require("../models/system/schoolModel");
const User = require("../models/system/userModel");
const TemplatePrivilege = require("../models/system/templatePrivilegeModel");
const Student = require("../models/studentInfo/studentModel");
const AcademicYear = require("../models/academics/academicYearModel");

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
    name: req.body.name,
    phone: req.body.phone,
    type: C.SUPERADMIN,
    privileges: templatePrivilege.privileges,
  });

  res.status(201).json({ msg: superadmin._id });
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
    throw new Error(C.getResourse404Id("TemplatePrivilege", req.params.id));
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
    throw new Error(C.getResourse404Id("TemplatePrivilege", req.params.id));
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
  const search = req.query.search;

  const query = {};
  if (C.isSchool(req.user.type)) query.school = req.user._id;

  if (search) {
    const fields = ["name", "email", "phone", "type"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
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

  const user = await User.findOne(query).select("-password").lean();

  if (!user) {
    res.status(404);
    throw new Error(C.getResourse404Id("User", req.params.id));
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

  if (C.isAdmin(req.user.type)) {
    type.push(C.SCHOOL);
  } else if (C.isSuperAdmin(req.user.type)) {
    type.push(C.ADMIN, C.SUPERADMIN);
  }

  res.status(200).json({ type: type.sort() });
});

// @desc    Create a User
// @route   POST /api/system/user
// @access  Private
const createUser = asyncHandler(async (req, res) => {
  const { email, name, phone, type } = req.body;

  // Validate type
  const notType = [C.SUPERADMIN, C.ADMIN];
  if (C.isAdmin(req.user.type)) {
    if (notType.includes(type)) {
      res.status(400);
      throw new Error(C.getValueNotSup(type));
    }
  } else if (C.isSchool(req.user.type)) {
    notType.push(C.SCHOOL);
    if (notType.includes(type)) {
      res.status(400);
      throw new Error(C.getValueNotSup(type));
    }
  }

  let school;
  if (![C.SUPERADMIN, C.ADMIN].includes(type)) {
    school = await UC.validateSchool(req.user, req.body.school);
  }

  console.log("school :>> ", school);

  // Get privileges
  const privileges = await TemplatePrivilege.findOne({ type }).lean();

  const user = await User.create({
    name,
    email,
    password: req.body.password || "123456",
    phone,
    type,
    privileges,
    school,
  });

  res.status(201).json({ msg: user._id });
});

// @desc    Update a User
// @route   PATCH /api/system/user/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const user = await User.findOne(query).select("type").lean();

  // Admin can not update superadmin
  if (
    !user ||
    (C.isAdmin(req.user.type) && [C.SUPERADMIN].includes(user.type)) ||
    (C.isSchool(req.user.type) && [C.SUPERADMIN, C.ADMIN].includes(user.type))
  ) {
    res.status(404);
    throw new Error(C.getResourse404Id("User", req.params.id));
  }

  const result = await User.updateOne(query, {
    $set: {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      privileges: req.body.privileges,
      school_details: req.body.school_details,
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
    throw new Error(C.getResourse404Id("User", req.params.id));
  }

  if (C.isSuperAdmin(user.type)) {
    res.status(400);
    throw new Error(`Can not delete ${C.SUPERADMIN}!`);
  }

  const result = await User.deleteOne({ _id: req.params.id });

  res.status(200).json(result);
});

// @desc    Reset student password
// @route   PATCH /api/system/user/reset-password
// @access  Private
const resetPassword = asyncHandler(async (req, res) => {
  const oldPass = req.body.old_password;
  const newPass = req.body.new_password;

  const user = await User.findById(req.user._id).select("password").lean();

  if (!bcrypt.compare(oldPass, user.password)) {
    res.status(400);
    throw new Error(C.INVALID_CREDENTIALS);
  }

  const result = await User.updateOne(
    { _id: req.user._id },
    { $set: { password: await bcrypt.hash(newPass, 10) } }
  );

  res.status(200).json(result);
});

/** 3. School */

// @desc    Get a school
// @route   GET /api/system/school
// @access  Private
const getSchool = asyncHandler(async (req, res) => {
  if (!C.isAdmins(req.user.type) && !C.isSchool(req.user.type)) {
    res.status(403);
    throw new Error("Access Denied");
  }

  const school = await School.findOne().lean();

  if (!school) {
    res.status(404);
    throw new Error(C.getResourse404("School"));
  }

  res.status(200).json(school);
});

// @desc    Add a school
// @route   POST /api/system/school
// @access  Private
const addSchool = asyncHandler(async (req, res) => {
  if (!C.isAdmins(req.user.type) && !C.isSchool(req.user.type)) {
    res.status(403);
    throw new Error("Access Denied");
  }

  const count = await School.countDocuments();
  if (count > 0) {
    res.status(403);
    throw new Error("A School already exists!");
  }

  const school = await School.create({
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
    morning_attendance_end: req.body.morning_attendance_end,
    bus_incharge: req.body.bus_incharge,
    library: req.body.library,
  });

  res.status(201).json({ msg: school._id });
});

// @desc    Update a school
// @route   PATCH /api/system/school
// @access  Private
const updateSchool = asyncHandler(async (req, res) => {
  if (!C.isAdmins(req.user.type) && !C.isSchool(req.user.type)) {
    res.status(403);
    throw new Error("Access Denied");
  }

  const lat = req.body.lat ? parseFloat(req.body.lat).toFixed(6) : undefined;
  const lon = req.body.lon ? parseFloat(req.body.lon).toFixed(6) : undefined;
  const busIncharge = req.body.bus_incharge;
  const library = req.body.library;

  const result = await School.updateOne(
    {},
    {
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
        morning_attendance_end: req.body.morning_attendance_end,
        "bus_incharge.name": busIncharge?.name,
        "bus_incharge.email": busIncharge?.email,
        "bus_incharge.phone": busIncharge?.phone,
        "library.fine_per_day": library?.fine_per_day,
        "library.book_issue_limit": library?.book_issue_limit,
        "library.book_issue_days": library?.book_issue_days,
      },
    }
  );

  res.status(200).json(result);
});

// @desc    Delete a school
// @route   DELETE /api/system/school
// @access  Private
const deleteSchool = asyncHandler(async (req, res) => {
  if (!C.isAdmins(req.user.type) && !C.isSchool(req.user.type)) {
    res.status(403);
    throw new Error("Access Denied");
  }

  if (await AcademicYear.any()) {
    res.status(400);
    throw new Error(C.getUnableToDel("School", "AcademicYear"));
  }

  if (await Student.any()) {
    res.status(400);
    throw new Error(C.getUnableToDel("School", "Student"));
  }

  const result = await School.deleteOne();

  res.status(200).json(result);
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
  resetPassword,

  getSchool,
  addSchool,
  updateSchool,
  deleteSchool,
};
