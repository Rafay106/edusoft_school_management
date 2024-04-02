const asyncHandler = require("express-async-handler");
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

      req.user = await User.findById(decode._id).select("-password").lean();

      if (C.isSchool(req.user.type)) {
        const school = await School.findOne({ school: req.user._id })
          .select("_id")
          .lean();

        if (school) req.user = { ...req.user, school: school._id };
      }

      if (!req.user) {
        res.status(404);
        throw new Error("404");
      }
    } catch (err) {
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

const parentAuthenticate = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decode = jwt.verify(token, process.env.SECRET);

      req.student = await Student.findById(decode._id)
        .select("-password")
        .lean();

      // req.user = await User.findById(req.student.school)
      //   .select("-password")
      //   .lean();

      if (!req.student) {
        res.status(404);
        throw new Error("404");
      }
    } catch (err) {
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

const adminPanelAuthorize = asyncHandler(async (req, res, next) => {
  const baseurl = req.baseUrl;
  const url = req.url;
  console.log("baseurl :>> ", baseurl);
  console.log("url :>> ", url);

  if (baseurl !== "/api/admin-panel") return next();

  const userType = req.user.type;

  if (C.isAdmins(userType)) {
    next();
  } else if (C.isManager(userType)) {
    next();
  } else if (C.isSchool(userType)) {
    if (req.url.includes("/bus")) next();
    else if (req.url.includes("/bus-stop")) next();
    else if (req.url.includes("/student")) next();
    else if (req.url.includes("/attendance")) next();
    else {
      next();
    }
  } else {
    res.status(404);
    throw new Error(C.URL_404);
  }
});

const adminAuthorize = asyncHandler(async (req, res, next) => {
  if (C.isAdmins(req.user.type)) next();
  else {
    res.status(403);
    throw new Error("Access Denied!");
  }
});

const adminAndManagerAuthorize = asyncHandler(async (req, res, next) => {
  if (C.isAdmins(req.user.type)) {
    next();
  } else if (C.isManager(req.user.type)) {
    next();
  } else if (C.isSchool(req.user.type)) {
    next();
  } else {
    res.status(403);
    throw new Error("Access Denied!");
  }
});

const parentAuthorize = asyncHandler(async (req, res, next) => {
  if (C.isParent(req.user.type)) next();
  else {
    res.status(403);
    throw new Error("Only parent account has access to this route.");
  }
});

module.exports = {
  authenticate,
  parentAuthenticate,
  adminPanelAuthorize,
  adminAuthorize,
  adminAndManagerAuthorize,
  parentAuthorize,
};
