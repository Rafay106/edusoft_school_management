const fs = require("node:fs");
const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const School = require("../models/schoolModel");
const User = require("../models/system/userModel");
const Privilege = require("../models/system/privilegeModel");

/** 1. User */

// @desc    Get Users
// @route   GET /api/admin-panel/user
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
// @route   GET /api/admin-panel/user/:id
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
// @route   GET /api/admin-panel/user/required-data
// @access  Private
const requiredDataUser = asyncHandler(async (req, res) => {
  const type = [];

  if (C.isManager(req.user.type)) {
    type.push(C.USER);
  } else if (req.user.type === C.ADMIN) {
    type.push(C.MANAGER);
  } else if (req.user.type === C.SUPERADMIN) {
    type.push(C.MANAGER, C.ADMIN, C.SUPERADMIN);
  }

  res.status(200).json({
    type: type.sort(),
  });
});

// @desc    Create a User
// @route   POST /api/admin-panel/user
// @access  Private
const createUser = asyncHandler(async (req, res) => {
  const { email, name, phone } = req.body;
  let type = req.body.type;
  let manager = req.body.manager;
  let school = req.body.school;

  // Validate type
  if (C.isAdmin(req.user.type)) {
    if ([C.SUPERADMIN, C.ADMIN].includes(type)) {
      res.status(400);
      throw new Error(C.getValueNotSup(type));
    }
  } else if (C.isManager(req.user.type)) {
    manager = req.user._id;
    if ([C.SUPERADMIN, C.ADMIN, C.MANAGER].includes(type)) {
      res.status(400);
      throw new Error(C.getValueNotSup(type));
    }
  } else if (C.isSchool(req.user.type)) {
    manager = req.user.manager;
    school = req.user._id;
    if ([C.SUPERADMIN, C.ADMIN, C.MANAGER, C.SCHOOL].includes(type)) {
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
    (C.isAdmins(req.user.type) || C.MANAGER === req.user.type) &&
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
  const privileges = await Privilege.findOne({ type }).lean();

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
// @route   PATCH /api/admin-panel/user/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await User.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("User", req.params.id));
  }

  const result = await User.updateOne(query, {
    $set: {
      email: req.body.email,
      name: req.body.name,
      mobile: req.body.mobile,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a user
// @route   DELETE /api/admin-panel/user/:id
// @access  Private
const deleteUser = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isManager(req.user.type)) query.manager = req.user._id;

  const result = await User.deleteOne(query);

  res.status(200).json(result);
});

/** 2. School */

// @desc    Get all schools
// @route   GET /api/admin-panel/school
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
// @route   GET /api/admin-panel/school/:id
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
// @route   POST /api/admin-panel/school
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
// @route   PUT /api/admin-panel/school/:id
// @access  Private
const updateSchool = asyncHandler(async (req, res) => {
  if (!(await School.any({ _id: req.params.id }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("School", req.params.id));
  }

  const lat = req.body.lat ? parseFloat(req.body.lat).toFixed(6) : undefined;
  const lon = req.body.lon ? parseFloat(req.body.lon).toFixed(6) : undefined;

  const result = await School.updateOne(
    { _id: req.params.id },
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
        "timings.morning": req.body.timings?.morning,
        "timings.afternoon": req.body.timings?.afternoon,
      },
    }
  );

  res.status(200).json(result);
});

// @desc    Delete a school
// @route   DELETE /api/admin-panel/school/:id
// @access  Private
const deleteSchool = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isManager(req.user.type)) query.manager = req.user._id;

  const result = await School.deleteOne(query);

  res.status(200).json(result);
});

// TODO
// @desc    Bulk operations for school
// @route   POST /api/admin-panel/school/bulk
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
