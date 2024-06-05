const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const School = require("../models/system/schoolModel");
const User = require("../models/system/userModel");
const {
  TemplatePrivilege,
} = require("../models/system/templatePrivilegeModel");
const Student = require("../models/studentInfo/studentModel");
const AcademicYear = require("../models/academics/academicYearModel");
const WhatsappCoinTransaction = require("../models/system/whatsappCoinTransactionModel");

const bcrypt = require("bcrypt");
const { credit } = require("../tools/whatsapp_coin");

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

  const crudSuperadmin = {
    enabled: true,
    create: true,
    read: true,
    update: true,
    delete: true,
  };

  // Superadmin
  const templatePrivilege = await TemplatePrivilege.create({
    type: C.SUPERADMIN,
    privileges: {
      system: {
        enabled: true,
        privilege_template: crudSuperadmin,
        user: crudSuperadmin,
        school: crudSuperadmin,
        whatsapp_coin: { enabled: true },
      },
      util: { enabled: true },
      adminSection: { enabled: true, id_card: { enabled: true } },
      academics: {
        enabled: true,
        academic_year: crudSuperadmin,
        section: crudSuperadmin,
        stream: crudSuperadmin,
        class: crudSuperadmin,
        subject: crudSuperadmin,
        class_routine: crudSuperadmin,
      },
      student_info: {
        enabled: true,
        boarding_type: crudSuperadmin,
        subward: crudSuperadmin,
        student: { ...crudSuperadmin, bulk_ops: true, attendance: true },
      },
      transport: {
        enabled: true,
        bus_staff: crudSuperadmin,
        bus_stop: { ...crudSuperadmin, bulk_ops: true },
        bus: {
          ...crudSuperadmin,
          bulk_ops: true,
          set_unset_alternate: true,
          track: true,
          bus_status: true,
        },
      },
      fee: {
        enabled: true,
        fee_group: crudSuperadmin,
        fee_type: crudSuperadmin,
        fee_term: crudSuperadmin,
        fee_concession: crudSuperadmin,
        fee_fine: crudSuperadmin,
        fee_structure: crudSuperadmin,
        calculate_fee: true,
        collect_fee: true,
      },
      hr: {
        enabled: true,
        department: crudSuperadmin,
        designation: crudSuperadmin,
        staff: crudSuperadmin,
      },
      parent_util: { enabled: true },
      parent: { enabled: true },
      dashboard: { enabled: true },
      library: {
        enabled: true,
        category: crudSuperadmin,
        subject: crudSuperadmin,
        book: crudSuperadmin,
        book_issued: crudSuperadmin,
      },
      homework: { ...crudSuperadmin, evaluation: crudSuperadmin },
      lesson_plan: {
        enabled: true,
        lesson: crudSuperadmin,
        topic: crudSuperadmin,
      },
      communication: {
        enabled: true,
        noticeboard: { ...crudSuperadmin, bulk_ops: true },
        send_message: { enabled: true },
      },
      api_key: { enabled: true },
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
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = {};
  if (C.isSchool(req.user.type)) query.school = req.school._id;

  if (search) {
    const fields = ["name", "email", "username", "phone", "type"];

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

  if (C.isSchool(req.user.type)) query.school = req.school._id;

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
  const { email, username, name, phone, type } = req.body;

  if (!email) {
    res.status(400);
    throw new Error(C.getFieldIsReq("email"));
  }

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

  // Get privileges
  const privileges = await TemplatePrivilege.findOne({ type }).lean();

  const user = await User.create({
    name,
    email,
    username,
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

// @desc    Set current academic-year
// @route   POST /api/system/user/set-current-ayear
// @access  Private
const setCurrentAcademicYear = asyncHandler(async (req, res) => {
  const ayear = req.body.ayear;

  if (!ayear) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ayear"));
  }

  if (!(await AcademicYear.any({ _id: ayear, school: req.school._id }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("ayear", ayear));
  }

  const result = await User.updateOne(
    { _id: req.user._id },
    { $set: { current_academic_year: ayear } }
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

  const school = await School.findOne()
    .populate("current_academic_year")
    .lean();

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

// @desc    Add whatsapp coins
// @route   POST /api/system/whatsapp-coin/add
// @access  Private
const addWhatsappCoins = asyncHandler(async (req, res) => {
  if (!C.isSuperAdmin(req.user.type)) {
    res.status(403);
    throw new Error(C.ACCESS_DENIED);
  }

  if (!req.body.coins) {
    res.status(400);
    throw new Error(C.getFieldIsReq("coins"));
  }

  const result = await credit(req.body.coins);

  res.status(200).json({ success: result });
});

// @desc    Get whatsapp coin transactions
// @route   POST /api/system/whatsapp-coin/transaction
// @access  Private
const getWhatsappCoinTransactions = asyncHandler(async (req, res) => {
  if (!C.isSuperAdmin(req.user.type)) {
    res.status(403);
    throw new Error(C.ACCESS_DENIED);
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "-createdAt";
  const dtFrom = req.body.from;
  const dtTo = req.body.to;

  if (!dtFrom) {
    res.status(400);
    throw new Error("from is required!");
  }

  if (!dtTo) {
    res.status(400);
    throw new Error("to is required!");
  }

  const query = {
    createdAt: {
      $gte: new Date(dtFrom),
      $lte: new Date(dtTo).setUTCHours(23, 59, 59, 999),
    },
  };

  const results = await UC.paginatedQuery(
    WhatsappCoinTransaction,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: "Page limit exceeded!" });

  const passbook = [];
  for (const txn of results.result) {
    passbook.push({
      date: UC.getDDMMYYYYwithTime(txn.createdAt),
      [txn.mode]: txn.coins.amount,
      balance: txn.coins.final,
    });
  }

  results.result = passbook;

  return res.status(200).json(results);
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
  setCurrentAcademicYear,

  getSchool,
  addSchool,
  updateSchool,
  deleteSchool,

  addWhatsappCoins,
  getWhatsappCoinTransactions,
};
