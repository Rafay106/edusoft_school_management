const asyncHandler = require("express-async-handler");
const crypto = require("node:crypto");
const requestIP = require("request-ip");
const jwt = require("jsonwebtoken");
const C = require("../constants");
const UC = require("../utils/common");
const User = require("../models/system/userModel");
const Student = require("../models/studentInfo/studentModel");
const School = require("../models/system/schoolModel");
const RolePrivilege = require("../models/system/rolePrivilegeModel");
const ClassTeacherAssign = require("../models/academics/classTeacherAssignModel");

const authenticate = asyncHandler(async (req, res, next) => {
  const cliendIP = requestIP.getClientIp(req);
  let logData = `${cliendIP} ${req.headers["user-agent"]} ${req.originalUrl}`;

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    UC.writeLog("op_logs", logData);

    res.status(401);
    throw new Error("Not authorized, no token");
  }

  let decode;
  try {
    decode = jwt.verify(token, process.env.SECRET);
  } catch (err) {
    console.log(err);
    res.status(401);
    throw new Error("Not Authorized!");
  }

  req.user = await User.findOne({
    _id: decode._id,
    password: decode.password,
  })
    .select("-password")
    .populate("role school")
    .lean();

  if (!req.user) {
    res.status(404);
    throw new Error("User not found!");
  }

  logData += ` ${req.user.email}`;

  req.school = await School.findOne().lean();

  if (
    req.school &&
    req.school.current_academic_year &&
    !req.user.current_academic_year
  ) {
    await User.updateOne(
      { _id: req.user._id },
      {
        $set: { current_academic_year: req.school.current_academic_year },
      }
    );

    req.user = await User.findOne({
      _id: decode._id,
    })
      .select("-password")
      .populate("role school")
      .lean();
  }

  if (!UC.isAdmins(req.user) && !UC.isSchool(req.user)) {
    // Always set current academic year to school.current_academic_year
    await User.updateOne(
      { _id: req.user._id },
      {
        $set: { current_academic_year: req.school.current_academic_year },
      }
    );

    req.user = await User.findOne({
      _id: decode._id,
    })
      .select("-password")
      .populate("role school")
      .lean();
  }

  req.ayear = req.user.current_academic_year;

  if (UC.isParent(req.user)) {
    req.students = await Student.find({
      parent: req.user._id,
      academic_year: req.user.current_academic_year,
    }).lean();
  } else if (UC.isTeacher(req.user)) {
    const CTA = await ClassTeacherAssign.findOne({
      teacher: req.user._id,
      academic_year: req.ayear,
    })
      .populate("class section", "name")
      .populate("subjects.class subjects.section", "name")
      .lean();

    req.user.class = CTA?.class;
    req.user.section = CTA?.section;
    req.user.subjects = CTA?.subjects;
  }

  const privilege = await RolePrivilege.findOne({
    role: req.user.role._id,
  }).lean();

  req.user.privileges = privilege?.privileges;

  UC.writeLog("op_logs", logData);
  next();
});

const authenticateApikey = asyncHandler(async (req, res, next) => {
  if (!req.query.key) {
    res.status(401);
    throw new Error("Not authorized, no api key");
  }

  const api_key = req.query.key;

  try {
    req.user = await User.findOne({ api_key })
      .select("-password")
      .populate("school")
      .lean();

    if (!req.user) {
      res.status(404);
      throw new Error("404");
    }

    req.school = await School.findOne().lean();

    if (
      req.school &&
      req.school.current_academic_year &&
      !req.user.current_academic_year
    ) {
      await User.updateOne(
        { _id: req.user._id },
        {
          $set: { current_academic_year: req.school.current_academic_year },
        }
      );

      req.user = await User.findOne({
        _id: decode._id,
      })
        .select("-password")
        .populate("school")
        .lean();
    }

    req.ayear = req.user.current_academic_year;

    if (!req.user.api_key) {
      await User.updateOne(
        { _id: req.user._id },
        { $set: { api_key: UC.generateApiKey() } }
      );

      req.user = await User.findOne({
        _id: decode._id,
        password: decode.password,
      })
        .select("-password")
        .populate("school")
        .lean();
    }
  } catch (err) {
    res.status(401);
    throw new Error("Not Authorized!");
  }

  next();
});

const authorize = asyncHandler(async (req, res, next) => {
  const bUrl = req.baseUrl;
  const url = req.url;
  const method = req.method;

  console.log("bUrl :>> ", bUrl);
  console.log("url :>> ", url);
  console.log("method :>> ", method);

  if (UC.isSuperAdmin(req.user)) return next();

  const privileges = req.user.privileges;

  if (bUrl === "/api/system") {
    const system = privileges.system;

    if (!system.enabled) throwAccessDenied(res);
    if (url.includes("role-privilege")) {
      const result = checkCRUDPrivileges(method, system.role_privilege);
      if (!result) throwAccessDenied(res);
      return next();
    } else if (url.includes("user")) {
      const result = checkCRUDPrivileges(method, system.user);
      if (!result) throwAccessDenied(res);
      return next();
    } else if (url.includes("school")) {
      if (url.includes("update-cash")) {
        if (!system.school.update_cash) throwAccessDenied(res);
        else return next();
      }

      const result = checkCRUDPrivileges(method, system.school);
      if (!result) throwAccessDenied(res);
      return next();
    } else if (url.includes("whatsapp-coin")) {
      if (!system.whatsapp_coin.enabled) throwAccessDenied(res);
      return next();
    } else return next();
  } else if (bUrl === "/api/user") {
    return next();
  } else if (bUrl === "/api/util") {
    if (!privileges.util.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/admin-section") {
    const adminSection = privileges.admin_section;

    if (!adminSection.enabled) throwAccessDenied(res);
    if (url.includes("id-card")) {
      if (!adminSection.id_card.enabled) return next();
      return next();
    }
  } else if (bUrl === "/api/academics") {
    const academics = privileges.academics;

    if (!academics.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/student-info") {
    const student_info = privileges.student_info;

    if (!student_info.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/transport") {
    const transport = privileges.transport;

    if (!transport.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/fee") {
    const fee = privileges.fee;

    if (!fee.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/test") {
    if (UC.isSuperAdmin(req.user)) return next();
    else throwAccessDenied(res);
  } else if (bUrl === "/api/hr") {
    const hr = privileges.hr;

    if (!hr.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/parent-util") {
    const parent_util = privileges.parent_util;

    if (!parent_util.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/parent") {
    const parent = privileges.parent;

    if (!parent.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/dashboard") {
    const dashboard = privileges.dashboard;

    if (!dashboard.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/library") {
    const library = privileges.library;

    if (!library.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/homework") {
    const homework = privileges.homework;

    if (!homework.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/lesson-schedule") {
    const lessonSchedule = privileges.lesson_schedule;

    if (!lessonSchedule.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/comms") {
    const comms = privileges.communication;

    if (!comms.enabled) throwAccessDenied(res);
    else return next();
  } else if (bUrl === "/api/examination") {
    const examination = privileges.examination;

    if (!examination.enabled) throwAccessDenied(res);
    else return next();
  } else return next();
});

const checkCRUDPrivileges = (method, privileges) => {
  if (!privileges.enabled) return false;

  if (method == "POST" && privileges.create) return true;
  else if (method == "GET" && privileges.read) return true;
  else if (method == "PATCH" && privileges.update) return true;
  else if (method == "DELETE" && privileges.delete) return true;
  else return false;
};

const throwAccessDenied = (res) => {
  res.status(403);
  throw new Error(C.ACCESS_DENIED);
};

module.exports = {
  authenticate,
  authenticateApikey,
  authorize,
};
