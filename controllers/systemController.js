const fs = require("node:fs");
const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const mongoose = require("mongoose");
const Role = require("../models/system/roleModel");
const School = require("../models/system/schoolModel");
const User = require("../models/system/userModel");
const RolePrivilege = require("../models/system/rolePrivilegeModel");
const Student = require("../models/studentInfo/studentModel");
const AcademicYear = require("../models/academics/academicYearModel");
const WhatsappCoinTransaction = require("../models/system/whatsappCoinTransactionModel");
const Device = require("../models/system/deviceModel");

const bcrypt = require("bcrypt");
const { credit } = require("../tools/whatsapp_coin");

const init = asyncHandler(async (req, res) => {
  const key = req.body.key;

  let superadminRole = await UC.getRoleId(C.SUPERADMIN);

  if (superadminRole) {
    if (await User.any({ type: superadminRole })) {
      res.status(400);
      throw new Error("Superadmin already exists");
    }
  }

  if (key !== process.env.SECRET) {
    res.status(400);
    throw new Error("Invalid Key");
  }

  if (!fs.existsSync("./init/system_roles.json")) {
    throw new Error("File not found: /init/system_roles.json");
  }

  const roleData = JSON.parse(
    fs.readFileSync("./init/system_roles.json", "utf8")
  );

  for (const role of roleData) {
    if (!(await Role.any({ title: role.title }))) {
      await Role.create({ title: role.title, access: role.access });
    }
  }

  if (!fs.existsSync("./init/system_role_privileges.json")) {
    throw new Error("File not found: /init/system_role_privileges.json");
  }

  const privilegesData = JSON.parse(
    fs.readFileSync("./init/system_role_privileges.json", "utf8")
  );

  const roles = await Role.find().select("title").lean();

  for (const role of roles) {
    const privilege = privilegesData.find((ele) => ele.role === role.title);

    await RolePrivilege.create({
      role: role._id,
      privileges: privilege?.privileges,
    });
  }

  superadminRole = await UC.getRoleId(C.SUPERADMIN);

  if (!superadminRole) {
    res.status(404);
    throw new Error(C.getResourse404Id("Role", C.SUPERADMIN));
  }

  const superadmin = await User.create({
    name: req.body.name,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    phone: req.body.phone,
    role: superadminRole,
  });

  res.status(201).json({ msg: superadmin._id });
});

const deleteEmptyCollections = asyncHandler(async (req, res) => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const emptyCollections = [];

  for (const collection of collections) {
    const count = await mongoose.connection.db
      .collection(collection.name)
      .countDocuments();
    if (count === 0) {
      emptyCollections.push(collection.name);
      await mongoose.connection.db.collection(collection.name).drop();
    }
  }

  res.status(200).json({
    total: emptyCollections.length,
    msg: emptyCollections,
  });
});

const backupDB = asyncHandler(async (req, res) => {
  const SERVICE = require("../services/service");

  const result = await SERVICE.serviceDbBackup();

  res.json({ success: true, msg: result });
});

/** 1. System Roles */

// @desc    Get Roles
// @route   GET /api/system/role
// @access  Private
const getRoles = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "title";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["title", "access"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(Role, query, "", page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a Role
// @route   GET /api/system/role/:id
// @access  Private
const getRole = asyncHandler(async (req, res) => {
  const role = await Role.findOne({
    _id: req.params.id,
  }).lean();

  if (!role) {
    res.status(404);
    throw new Error(C.getResourse404Id("Role", req.params.id));
  }

  res.status(200).json(role);
});

// @desc    Create a Role
// @route   POST /api/system/role
// @access  Private
const createRole = asyncHandler(async (req, res) => {
  const role = await Role.create({
    title: req.body.title,
    access: req.body.access,
  });

  res.status(201).json({ msg: role._id });
});

// @desc    Update a Role
// @route   PATCH /api/system/role/:id
// @access  Private
const updateRole = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await Role.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("Role", req.params.id));
  }

  const result = await Role.updateOne(query, {
    $set: { title: req.body.title, access: req.body.access },
  });

  res.status(200).json(result);
});

// @desc    Delete a Role
// @route   DELETE /api/system/role/:id
// @access  Private
const deleteRole = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await User.any({ type: req.params.id }))) {
    res.status(400);
    throw new Error(C.getUnableToDel("Role", "User"));
  }

  const result = await Role.deleteOne(query);

  res.status(200).json(result);
});

// @desc    Update a Role
// @route   PATCH /api/system/role/update-from-file
// @access  Private
const updateRoleFromFile = asyncHandler(async (req, res) => {
  const filePath = path.join("init", "system_role_privileges.json");

  if (!fs.existsSync(filePath)) {
    res.status(500);
    throw new Error("File: 'system_role_privileges.json' not found!");
  }

  const fileData = JSON.parse(fs.readFileSync(filePath));
  const ROLES = await Role.find().lean();

  for (const role of ROLES) {
    const roleId = await UC.getRoleId(role.title);

    const privilege = fileData.find((ele) => ele.role === role.title);

    const query = { role: roleId };

    if (await RolePrivilege.any(query)) {
      await RolePrivilege.deleteOne(query);
    }

    await RolePrivilege.create({
      role: roleId,
      privileges: privilege?.privileges,
    });
  }

  const privileges = await RolePrivilege.find().lean();

  res.status(200).json(privileges);
});

/** 2. RolePrivilege */

// @desc    Get RolePrivileges
// @route   GET /api/system/role-privilege
// @access  Private
const getRolePrivileges = asyncHandler(async (req, res) => {
  const privileges = await RolePrivilege.find()
    .populate("role", "title")
    .lean();

  privileges.sort((a, b) => {
    if (a.role && b.role) {
      return a.role.title.localeCompare(b.role.title);
    }

    return 0;
  });

  res.status(200).json(privileges);
});

// @desc    Get a RolePrivilege
// @route   GET /api/system/role-privilege/:id
// @access  Private
const getRolePrivilege = asyncHandler(async (req, res) => {
  const role = await RolePrivilege.findOne({
    _id: req.params.id,
  }).lean();

  if (!role) {
    res.status(404);
    throw new Error(C.getResourse404Id("RolePrivilege", req.params.id));
  }

  res.status(200).json(role);
});

// @desc    Create a RolePrivilege
// @route   POST /api/system/role-privilege
// @access  Private
const createRolePrivilege = asyncHandler(async (req, res) => {
  const role = await RolePrivilege.create(req.body);

  res.status(201).json({ msg: role._id });
});

// @desc    Update a RolePrivilege
// @route   PATCH /api/system/role-privilege/:id
// @access  Private
const updateRolePrivilege = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await RolePrivilege.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("RolePrivilege", req.params.id));
  }

  const result = await RolePrivilege.updateOne(query, {
    $set: {
      privileges: {
        system: {
          enabled: req.body.system?.enabled,
          privilege_role: {
            enabled: req.body.system?.privilege_role?.enabled,
            create: req.body.system?.privilege_role?.create,
            read: req.body.system?.privilege_role?.read,
            update: req.body.system?.privilege_role?.update,
            delete: req.body.system?.privilege_role?.delete,
          },
          user: {
            enabled: req.body.system?.user?.enabled,
            create: req.body.system?.user?.create,
            read: req.body.system?.user?.read,
            update: req.body.system?.user?.update,
            delete: req.body.system?.user?.delete,
          },
          school: {
            enabled: req.body.system?.school?.enabled,
            create: req.body.system?.school?.create,
            read: req.body.system?.school?.read,
            update: req.body.system?.school?.update,
            delete: req.body.system?.school?.delete,
          },
          whatsapp_coin: {
            enabled: req.body.system?.whatsapp_coin?.enabled,
          },
        },
        util: {
          enabled: req.body.util?.enabled,
        },
        adminSection: {
          enabled: req.body.adminSection?.enabled,
          id_card: {
            enabled: req.body.adminSection?.id_card?.enabled,
          },
        },
        academics: {
          enabled: req.body.academics?.enabled,
          academic_year: {
            enabled: req.body.academics?.academic_year?.enabled,
            create: req.body.academics?.academic_year?.create,
            read: req.body.academics?.academic_year?.read,
            update: req.body.academics?.academic_year?.update,
            delete: req.body.academics?.academic_year?.delete,
          },
          section: {
            enabled: req.body.academics?.section?.enabled,
            create: req.body.academics?.section?.create,
            read: req.body.academics?.section?.read,
            update: req.body.academics?.section?.update,
            delete: req.body.academics?.section?.delete,
          },
          stream: {
            enabled: req.body.academics?.stream?.enabled,
            create: req.body.academics?.stream?.create,
            read: req.body.academics?.stream?.read,
            update: req.body.academics?.stream?.update,
            delete: req.body.academics?.stream?.delete,
          },
          class: {
            enabled: req.body.academics?.class?.enabled,
            create: req.body.academics?.class?.create,
            read: req.body.academics?.class?.read,
            update: req.body.academics?.class?.update,
            delete: req.body.academics?.class?.delete,
          },
          subject: {
            enabled: req.body.academics?.subject?.enabled,
            create: req.body.academics?.subject?.create,
            read: req.body.academics?.subject?.read,
            update: req.body.academics?.subject?.update,
            delete: req.body.academics?.subject?.delete,
          },
          class_routine: {
            enabled: req.body.academics?.class_routine?.enabled,
            create: req.body.academics?.class_routine?.create,
            read: req.body.academics?.class_routine?.read,
            update: req.body.academics?.class_routine?.update,
            delete: req.body.academics?.class_routine?.delete,
          },
        },
        student_info: {
          enabled: req.body.student_info?.enabled,
          boarding_type: {
            enabled: req.body.student_info?.boarding_type?.enabled,
            create: req.body.student_info?.boarding_type?.create,
            read: req.body.student_info?.boarding_type?.read,
            update: req.body.student_info?.boarding_type?.update,
            delete: req.body.student_info?.boarding_type?.delete,
          },
          subward: {
            enabled: req.body.student_info?.subward?.enabled,
            create: req.body.student_info?.subward?.create,
            read: req.body.student_info?.subward?.read,
            update: req.body.student_info?.subward?.update,
            delete: req.body.student_info?.subward?.delete,
          },
          student: {
            enabled: req.body.student_info?.student?.enabled,
            create: req.body.student_info?.student?.create,
            read: req.body.student_info?.student?.read,
            update: req.body.student_info?.student?.update,
            delete: req.body.student_info?.student?.delete,
            bulk_ops: req.body.student_info?.student?.bulk_ops,
            attendance: req.body.student_info?.student?.attendance,
          },
        },
        transport: {
          enabled: req.body.transport?.enabled,
          bus_staff: {
            enabled: req.body.transport?.bus_staff?.enabled,
            create: req.body.transport?.bus_staff?.create,
            read: req.body.transport?.bus_staff?.read,
            update: req.body.transport?.bus_staff?.update,
            delete: req.body.transport?.bus_staff?.delete,
          },
          bus_stop: {
            enabled: req.body.transport?.bus_stop?.enabled,
            create: req.body.transport?.bus_stop?.create,
            read: req.body.transport?.bus_stop?.read,
            update: req.body.transport?.bus_stop?.update,
            delete: req.body.transport?.bus_stop?.delete,
            bulk_ops: req.body.transport?.bus_stop?.bulk_ops,
          },
          bus: {
            enabled: req.body.transport?.bus?.enabled,
            create: req.body.transport?.bus?.create,
            read: req.body.transport?.bus?.read,
            update: req.body.transport?.bus?.update,
            delete: req.body.transport?.bus?.delete,
            bulk_ops: req.body.transport?.bus?.bulk_ops,
            set_unset_alternate: req.body.transport?.bus?.set_unset_alternate,
            track: req.body.transport?.bus?.track,
            bus_status: req.body.transport?.bus?.bus_status,
          },
        },
        fee: {
          enabled: req.body.fee?.enabled,
          fee_group: {
            enabled: req.body.fee?.fee_group?.enabled,
            create: req.body.fee?.fee_group?.create,
            read: req.body.fee?.fee_group?.read,
            update: req.body.fee?.fee_group?.update,
            delete: req.body.fee?.fee_group?.delete,
          },
          fee_type: {
            enabled: req.body.fee?.fee_type?.enabled,
            create: req.body.fee?.fee_type?.create,
            read: req.body.fee?.fee_type?.read,
            update: req.body.fee?.fee_type?.update,
            delete: req.body.fee?.fee_type?.delete,
          },
          fee_term: {
            enabled: req.body.fee?.fee_term?.enabled,
            create: req.body.fee?.fee_term?.create,
            read: req.body.fee?.fee_term?.read,
            update: req.body.fee?.fee_term?.update,
            delete: req.body.fee?.fee_term?.delete,
          },
          fee_concession: {
            enabled: req.body.fee?.fee_concession?.enabled,
            create: req.body.fee?.fee_concession?.create,
            read: req.body.fee?.fee_concession?.read,
            update: req.body.fee?.fee_concession?.update,
            delete: req.body.fee?.fee_concession?.delete,
          },
          fee_fine: {
            enabled: req.body.fee?.fee_fine?.enabled,
            create: req.body.fee?.fee_fine?.create,
            read: req.body.fee?.fee_fine?.read,
            update: req.body.fee?.fee_fine?.update,
            delete: req.body.fee?.fee_fine?.delete,
          },
          fee_structure: {
            enabled: req.body.fee?.fee_structure?.enabled,
            create: req.body.fee?.fee_structure?.create,
            read: req.body.fee?.fee_structure?.read,
            update: req.body.fee?.fee_structure?.update,
            delete: req.body.fee?.fee_structure?.delete,
          },
          calculate_fee: req.body.fee?.calculate_fee,
          collect_fee: req.body.fee?.collect_fee,
        },
        hr: {
          enabled: req.body.hr?.enabled,
          department: {
            enabled: req.body.hr?.department?.enabled,
            create: req.body.hr?.department?.create,
            read: req.body.hr?.department?.read,
            update: req.body.hr?.department?.update,
            delete: req.body.hr?.department?.delete,
          },
          designation: {
            enabled: req.body.hr?.designation?.enabled,
            create: req.body.hr?.designation?.create,
            read: req.body.hr?.designation?.read,
            update: req.body.hr?.designation?.update,
            delete: req.body.hr?.designation?.delete,
          },
          staff: {
            enabled: req.body.hr?.staff?.enabled,
            create: req.body.hr?.staff?.create,
            read: req.body.hr?.staff?.read,
            update: req.body.hr?.staff?.update,
            delete: req.body.hr?.staff?.delete,
          },
        },
        parent_util: {
          enabled: req.body.parent_util?.enabled,
        },
        parent: {
          enabled: req.body.parent?.enabled,
        },
        dashboard: {
          enabled: req.body.dashboard?.enabled,
        },
        library: {
          enabled: req.body.library?.enabled,
          category: {
            enabled: req.body.library?.category?.enabled,
            create: req.body.library?.category?.create,
            read: req.body.library?.category?.read,
            update: req.body.library?.category?.update,
            delete: req.body.library?.category?.delete,
          },
          subject: {
            enabled: req.body.library?.subject?.enabled,
            create: req.body.library?.subject?.create,
            read: req.body.library?.subject?.read,
            update: req.body.library?.subject?.update,
            delete: req.body.library?.subject?.delete,
          },
          book: {
            enabled: req.body.library?.book?.enabled,
            create: req.body.library?.book?.create,
            read: req.body.library?.book?.read,
            update: req.body.library?.book?.update,
            delete: req.body.library?.book?.delete,
          },
          book_issued: {
            enabled: req.body.library?.book_issued?.enabled,
            create: req.body.library?.book_issued?.create,
            read: req.body.library?.book_issued?.read,
            update: req.body.library?.book_issued?.update,
            delete: req.body.library?.book_issued?.delete,
          },
        },
        homework: {
          enabled: req.body.homework?.enabled,
          create: req.body.homework?.create,
          read: req.body.homework?.read,
          update: req.body.homework?.update,
          delete: req.body.homework?.delete,
          evaluation: {
            enabled: req.body.homework?.evaluation?.enabled,
            create: req.body.homework?.evaluation?.create,
            read: req.body.homework?.evaluation?.read,
            update: req.body.homework?.evaluation?.update,
            delete: req.body.homework?.evaluation?.delete,
          },
        },
        lesson_plan: {
          enabled: req.body.lesson_plan?.enabled,
          lesson: {
            enabled: req.body.lesson_plan?.lesson?.enabled,
            create: req.body.lesson_plan?.lesson?.create,
            read: req.body.lesson_plan?.lesson?.read,
            update: req.body.lesson_plan?.lesson?.update,
            delete: req.body.lesson_plan?.lesson?.delete,
          },
          topic: {
            enabled: req.body.lesson_plan?.topic?.enabled,
            create: req.body.lesson_plan?.topic?.create,
            read: req.body.lesson_plan?.topic?.read,
            update: req.body.lesson_plan?.topic?.update,
            delete: req.body.lesson_plan?.topic?.delete,
          },
        },
        communication: {
          enabled: req.body.communication?.enabled,
          noticeboard: {
            enabled: req.body.communication?.noticeboard?.enabled,
            create: req.body.communication?.noticeboard?.create,
            read: req.body.communication?.noticeboard?.read,
            update: req.body.communication?.noticeboard?.update,
            delete: req.body.communication?.noticeboard?.delete,
            bulk_ops: req.body.communication?.noticeboard?.bulk_ops,
          },
          send_message: {
            enabled: req.body.communication?.send_message?.enabled,
          },
        },
        examination: {
          enabled: req.body.examination?.enabled,
        },
        api_key: {
          enabled: req.body.api_key?.enabled,
        },
      },
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a RolePrivilege
// @route   DELETE /api/system/role-privilege/:id
// @access  Private
const deleteRolePrivilege = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const result = await RolePrivilege.deleteOne(query);

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
  if (UC.isSchool(req.user)) query.school = req.school._id;

  if (search) {
    const fields = ["name", "email", "username", "phone"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const select = "name email username phone role";

  const results = await UC.paginatedQuery(
    User,
    query,
    select,
    page,
    limit,
    sort,
    ["role", "title"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a User
// @route   GET /api/system/user/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (UC.isSchool(req.user)) query.school = req.school._id;

  const user = await User.findOne(query)
    .select("-password")
    .populate("role school", "name title")
    .lean();

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

  if (UC.isSuperAdmin(req.user)) {
    type.push(C.ADMIN, C.SUPERADMIN);
  } else if (UC.isAdmin(req.user)) {
    type.push(C.SCHOOL);
  }

  res.status(200).json({ type: type.sort() });
});

// @desc    Create a User
// @route   POST /api/system/user
// @access  Private
const createUser = asyncHandler(async (req, res) => {
  const { email, username, name, phone } = req.body;

  if (!email) {
    res.status(400);
    throw new Error(C.getFieldIsReq("email"));
  }

  const role = await Role.findOne({ title: req.body.role }).lean();

  // Validate role
  const excludeRole = [C.SUPERADMIN, C.ADMIN];
  if (UC.isAdmin(req.user)) {
    if (excludeRole.includes(role.title)) {
      res.status(400);
      throw new Error(C.getValueNotSup(role.title));
    }
  } else if (UC.isSchool(req.user)) {
    excludeRole.push(C.SCHOOL);
    if (excludeRole.includes(role.title)) {
      res.status(400);
      throw new Error(C.getValueNotSup(role.title));
    }
  }

  let school;
  if (![C.SUPERADMIN, C.ADMIN].includes(role.title)) {
    school = await School.findOne().lean();

    if (!school) {
      res.status(500);
      throw new Error("Please create school first!");
    }
  }

  const user = await User.create({
    name,
    email,
    username,
    password: req.body.password || "123456",
    phone,
    role: role._id,
    school,
  });

  res.status(201).json({ msg: user._id });
});

// @desc    Update a User
// @route   PATCH /api/system/user/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const user = await User.findOne(query).populate("role", "title").lean();

  // Admin can not update superadmin
  if (
    !user ||
    (UC.isAdmin(req.user) && UC.isSuperAdmin(user)) ||
    (UC.isSchool(req.user) && UC.isAdmins(user))
  ) {
    res.status(404);
    throw new Error(C.getResourse404Id("User", req.params.id));
  }

  const currPass = req.body.curr_pass;
  const newPass = req.body.new_pass;

  if (newPass) {
    if (!currPass) {
      res.status(400);
      throw new Error(C.getFieldIsReq("curr_pass"));
    }

    if (!(await bcrypt.compare(currPass, user.password))) {
      res.status(401);
      throw new Error(C.INVALID_CREDENTIALS);
    }
  }

  const result = await User.updateOne(query, {
    $set: {
      name: req.body.name,
      email: req.body.email,
      username: req.body.username,
      password: newPass ? await bcrypt.hash(newPass, 10) : undefined,
      phone: req.body.phone,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a user
// @route   DELETE /api/system/user/:id
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("role")
    .populate("role", "title")
    .lean();

  if (!user) {
    res.status(400);
    throw new Error(C.getResourse404Id("User", req.params.id));
  }

  if (UC.isSuperAdmin(user)) {
    res.status(400);
    throw new Error(`Can not delete ${C.SUPERADMIN}!`);
  }

  const result = await User.deleteOne({ _id: req.params.id });

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
  const count = await School.countDocuments();
  if (count > 0) {
    res.status(403);
    throw new Error("A School already exists!");
  }

  const defaults = req.body.defaults;
  if (defaults) {
    if (defaults.razorpay_bank) {
      defaults.razorpay_bank = await UC.validateBankByName(
        defaults.razorpay_bank
      );
    }
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
    defaults: { razorpay_bank: defaults?.razorpay_bank },
    morning_attendance_end: req.body.morning_attendance_end,
    half_day_end: req.body.half_day_end,
    bus_incharge: req.body.bus_incharge,
    library: req.body.library,
  });

  res.status(201).json({ msg: school._id });
});

// @desc    Update a school
// @route   PATCH /api/system/school
// @access  Private
const updateSchool = asyncHandler(async (req, res) => {
  const lat = req.body.lat ? parseFloat(req.body.lat).toFixed(6) : undefined;
  const lon = req.body.lon ? parseFloat(req.body.lon).toFixed(6) : undefined;

  const defaults = req.body.defaults;
  if (defaults) {
    if (defaults.razorpay_bank) {
      defaults.razorpay_bank = await UC.validateBankByName(
        defaults.razorpay_bank
      );
    }
  }

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
        defaults: { razorpay_bank: defaults?.razorpay_bank },
        cash_amount: req.body.cash_amount,
        morning_attendance_end: req.body.morning_attendance_end,
        half_day_end: req.body.half_day_end,
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

// @desc    Add or Subtract cash
// @route   POST /api/system/school/update-cash
// @access  Private
const updateSchoolCash = asyncHandler(async (req, res) => {
  const cash = req.body.cash;
  const operation = req.body.operation;

  if (!cash) {
    res.status(400);
    throw new Error(C.getFieldIsReq("cash"));
  }

  if (!operation) {
    res.status(400);
    throw new Error(C.getFieldIsReq("operation"));
  }

  let result;
  if (operation === "+") {
    result = await School.updateOne({}, { $inc: { cash_amount: cash } });
  } else if (operation === "-") {
    result = await School.updateOne({}, { $inc: { cash_amount: -cash } });
  } else {
    res.status(400);
    throw new Error(`Invalid operation: ${operation}`);
  }

  res.status(200).json(result);
});

/** 4. WhatsappCoin */

// @desc    Add whatsapp coins
// @route   POST /api/system/whatsapp-coin/add
// @access  Private
const addWhatsappCoins = asyncHandler(async (req, res) => {
  if (!UC.isSuperAdmin(req.user)) {
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
  if (!UC.isSuperAdmin(req.user)) {
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

/** 5. Device */

// @desc    Get  devices
// @route   GET /api/system/device
// @access  Private
const getDevices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["imei", "type"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(Device, query, "", page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a device
// @route   GET /api/system/device/:id
// @access  Private
const getDevice = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const device = await Device.findOne(query).lean();

  if (!device) {
    res.status(404);
    throw new Error(C.getResourse404("Device"));
  }

  res.status(200).json(device);
});

// @desc    Add a device
// @route   POST /api/system/device
// @access  Private
const addDevice = asyncHandler(async (req, res) => {
  const device = await Device.create({
    imei: req.body.imei,
    type: req.body.type,
  });

  res.status(201).json({ msg: device._id });
});

// @desc    Update a device
// @route   PATCH /api/system/device/:id
// @access  Private
const updateDevice = asyncHandler(async (req, res) => {
  if (!UC.isAdmins(req.user) && !C.isDevice(req.user.type)) {
    res.status(403);
    throw new Error("Access Denied");
  }

  const query = { _id: req.params.id };

  const result = await Device.updateOne(query, {
    $set: { type: req.body.type },
  });

  res.status(200).json(result);
});

// @desc    Delete a device
// @route   DELETE /api/system/device/:imei
// @access  Private
const deleteDevice = asyncHandler(async (req, res) => {
  if (!UC.isAdmins(req.user) && !C.isDevice(req.user.type)) {
    res.status(403);
    throw new Error("Access Denied");
  }

  const result = await Device.deleteOne({ imei: req.query.imei });

  res.status(200).json(result);
});

module.exports = {
  init,
  deleteEmptyCollections,
  backupDB,

  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  updateRoleFromFile,

  getRolePrivileges,
  getRolePrivilege,
  createRolePrivilege,
  updateRolePrivilege,
  deleteRolePrivilege,

  getUsers,
  getUser,
  requiredDataUser,
  createUser,
  updateUser,
  deleteUser,
  setCurrentAcademicYear,

  getSchool,
  addSchool,
  updateSchool,
  deleteSchool,
  updateSchoolCash,

  addWhatsappCoins,
  getWhatsappCoinTransactions,

  getDevices,
  getDevice,
  addDevice,
  updateDevice,
  deleteDevice,
};
