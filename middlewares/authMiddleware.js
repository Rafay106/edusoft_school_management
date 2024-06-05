const asyncHandler = require("express-async-handler");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const C = require("../constants");
const UC = require("../utils/common");
const User = require("../models/system/userModel");
const Student = require("../models/studentInfo/studentModel");
const School = require("../models/system/schoolModel");

const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decode = jwt.verify(token, process.env.SECRET);

      req.user = await User.findOne({
        _id: decode._id,
        password: decode.password,
      })
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
          { $set: { api_key: crypto.randomBytes(32).toString("hex") } }
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
      console.log(err);
      res.status(401);
      throw new Error("Not Authorized!");
    }

    next();
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
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
  const userType = req.user.type;
  const privileges = req.user.privileges;

  const bUrl = req.baseUrl;
  const url = req.url;
  const method = req.method;

  console.log("bUrl :>> ", bUrl);
  console.log("url :>> ", url);
  console.log("method :>> ", method);

  if (userType) return next();

  if (bUrl === "/api/system") {
    const system = privileges.system;

    if (!system.enabled) throwAccessDenied(res);
    if (url.includes("template-privilege")) {
      const result = checkCRUDPrivileges(method, system.privilege_template);
      if (!result) throwAccessDenied(res);
      return next();
    } else if (url.includes("user")) {
      const result = checkCRUDPrivileges(method, system.user);
      if (!result) throwAccessDenied(res);
      return next();
    } else if (url.includes("school")) {
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
  } else throwAccessDenied(res);
});

const adminAuthorize = asyncHandler(async (req, res, next) => {
  if (C.isAdmins(req.user.type)) next();
  else {
    res.status(403);
    throw new Error(C.ACCESS_DENIED);
  }
});

const schoolAuthorize = asyncHandler(async (req, res, next) => {
  if (C.isAdmins(req.user.type)) {
    next();
  } else if (C.isSchool(req.user.type)) {
    next();
  } else {
    res.status(403);
    throw new Error(C.ACCESS_DENIED);
  }
});

const parentAuthorize = asyncHandler(async (req, res, next) => {
  if (C.isParent(req.user.type)) next();
  else {
    res.status(403);
    throw new Error("Only parent account has access to this route.");
  }
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
  adminAuthorize,
  schoolAuthorize,
  parentAuthorize,
};
