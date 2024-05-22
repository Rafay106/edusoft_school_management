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

const authorize = asyncHandler(async (req, res, next) => {
  const userType = req.user.type;
  const bUrl = req.baseUrl;
  const url = req.url;

  console.log("bUrl :>> ", bUrl);
  console.log("url :>> ", url);
  if (C.isAdmins(userType)) return next();

  if (bUrl === "/api/system" && url.includes("/user")) {
    if (C.isManager(userType) || C.isSchool(userType)) next();
    else {
      res.status(403);
      throw new Error("Access Denied!");
    }
  } else {
    res.status(403);
    throw new Error("Access Denied!");
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
  authorize,
  adminAuthorize,
  adminAndManagerAuthorize,
  parentAuthorize,
};
