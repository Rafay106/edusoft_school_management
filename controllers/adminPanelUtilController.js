const asyncHandler = require("express-async-handler");
const User = require("../models/system/userModel");
const C = require("../constants");
const Bus = require("../models/transport/busModel");
const BusStop = require("../models/transport/busStopModel");
const School = require("../models/schoolModel");

// @desc    Get managers
// @route   GET /api/admin-panel/util/manager-list
// @access  Private
const getManagerList = asyncHandler(async (req, res) => {
  const search = req.query.search;
  const managerList = [];

  if (!C.isAdmins(req.user.type)) return res.status(200).json(managerList);

  if (!search) {
    const managers = await User.find({ type: C.MANAGER })
      .select("email")
      .sort("email")
      .limit(20)
      .lean();

    managers.forEach((m) => managerList.push(m));

    return res.status(200).json(managerList);
  }

  const managers = await User.find({
    type: C.MANAGER,
    $or: [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ],
  })
    .select("email")
    .sort("email")
    .lean();

  managers.forEach((m) => managerList.push(m));

  res.status(200).json(managerList);
});

// @desc    Get users
// @route   GET /api/admin-panel/util/user-list
// @access  Private
const getUserList = asyncHandler(async (req, res) => {
  const { search, form } = req.query;
  let manager = req.query.manager;
  const user = [];

  if (!manager) {
    res.status(400);
    throw new Error(C.getFieldIsReq("manager"));
  }

  if (C.isManager(req.user.type)) {
    manager = req.user._id;
  }

  if (!(await User.any({ _id: manager, type: C.MANAGER }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  const query = { type: C.USER, manager };
  const schoolQuery = { manager };

  const notUser = [];
  if (form === "school") {
    const schools = await School.find(schoolQuery).select("user").lean();

    schools.forEach((s) => notUser.push(s.user.toString()));
  }

  if (!search) {
    const users = await User.find(query)
      .select("name")
      .sort("name")
      .limit(20)
      .lean();

    users.forEach((u) => {
      if (!notUser.includes(u._id.toString())) user.push(u);
    });

    return res.status(200).json(user);
  }

  query["$or"] = [
    { email: { $regex: search, $options: "i" } },
    { name: { $regex: search, $options: "i" } },
  ];

  const users = await User.find(query).select("name").sort("name").lean();

  users.forEach((u) => {
    if (!notUser.includes(u._id)) user.push(u);
  });

  res.status(200).json(user);
});

// @desc    Get bus
// @route   GET /api/admin-panel/util/school-list
// @access  Private
const getSchoolList = asyncHandler(async (req, res) => {
  const query = {};

  if (C.isSchool(req.user.type)) {
    query.user = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const schools = await School.find(query).select("name").lean();

  res.status(200).json(schools);
});

// @desc    Get bus
// @route   GET /api/admin-panel/util/bus-list
// @access  Private
const getBusList = asyncHandler(async (req, res) => {
  let user = req.query.user;

  if (!user) {
    res.status(400);
    throw new Error(C.getFieldIsReq("user"));
  }

  if (C.isSchool(req.user.type)) user = req.user._id;

  if (!(await User.any({ _id: user }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("user", user));
  }

  const buses = await Bus.find({ user }).select("name stops").lean();

  res.status(200).json(buses);
});

// @desc    Get bus-stop
// @route   GET /api/admin-panel/util/bus-stop-list
// @access  Private
const getBusStopList = asyncHandler(async (req, res) => {
  let user = req.query.user;

  if (!user) {
    res.status(400);
    throw new Error(C.getFieldIsReq("user"));
  }

  if (!(await User.any({ _id: user }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("user", user));
  }

  if (C.isSchool(req.user.type)) user = req.user._id;

  const busStops = await BusStop.find({ user }).select("name").lean();

  res.status(200).json(busStops);
});

module.exports = {
  getManagerList,
  getUserList,
  getSchoolList,
  getBusList,
  getBusStopList,
};
