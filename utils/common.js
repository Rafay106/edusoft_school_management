const fs = require("node:fs");
const path = require("node:path");
const xlsx = require("xlsx");

const C = require("../constants");
const School = require("../models/system/schoolModel");
const Bus = require("../models/transport/busModel");
const Student = require("../models/studentInfo/studentModel");
const { isUsernameValid } = require("./validators");
const User = require("../models/system/userModel");

const createSearchQuery = (fields, value) => {
  const query = { $or: [] };

  const regex = new RegExp(value, "i");

  for (const field of fields) {
    query.$or.push({
      ["$expr"]: { $regexMatch: { input: { $toString: `$${field}` }, regex } },
    });
  }

  return query;
};

const paginatedQuery = async (
  Model,
  query,
  select,
  page,
  limit,
  sort,
  populate = ["", ""]
) => {
  const total = await Model.countDocuments(query);
  const pages = Math.ceil(total / limit) || 1;
  if (page > pages) return false;
  const startIdx = (page - 1) * limit;
  const results = { total: total, pages, page, result: [] };

  results.result = await Model.find(query)
    .select(select)
    .skip(startIdx)
    .limit(limit)
    .populate(populate[0], populate[1])
    .sort(sort)
    .lean();

  return results;
};

const excelToJson = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  return data;
};

// ************************
// USER FUNCTIONS START
// ************************

const getUsernameFromEmail = (email) => {
  const username = require("unique-username-generator").generateFromEmail(
    email
  );

  const maxLen = 22;

  if (username.length >= maxLen) return username.slice(0, maxLen - 1);

  return username;
};

const managerExists = async (_id) => await User.any({ _id, type: C.MANAGER });

const schoolAccExists = async (_id) => await User.any({ _id, type: C.SCHOOL });

// ************************
// USER FUNCTIONS END
// ************************

// ************************
// SCHOOL FUNCTIONS START
// ************************

const getCurrentAcademicYear = async (schoolId) => {
  const school = await School.findOne({ school: schoolId })
    .select("current_academic_year")
    .lean();

  if (!school.current_academic_year) {
    const err = new Error(
      "Current academic year not set, please set the current academic year!"
    );
    err.name = C.CUSTOMVALIDATION;

    throw err;
  }

  return school.current_academic_year;
};

const addMultipleSchools = async (userId, fileData) => {
  const schools = [];

  for (let i = 0; i < fileData.length; i++) {
    const school = fileData[i];
    const errors = [];

    if (!school.name) errors.push(C.getFieldIsReqAtIdx("name", i));
    if (!school.email) errors.push(C.getFieldIsReqAtIdx("email", i));
    if (!school.phone) errors.push(C.getFieldIsReqAtIdx("phone", i));
    if (!school.address) errors.push(C.getFieldIsReqAtIdx("address", i));
    if (!school.country) errors.push(C.getFieldIsReqAtIdx("country", i));
    if (!school.state) errors.push(C.getFieldIsReqAtIdx("state", i));
    if (!school.city) errors.push(C.getFieldIsReqAtIdx("city", i));
    if (!school.pincode) errors.push(C.getFieldIsReqAtIdx("pincode", i));
    if (!school.lat) errors.push(C.getFieldIsReqAtIdx("lat", i));
    if (!school.lon) errors.push(C.getFieldIsReqAtIdx("lon", i));
    if (!school.radius) errors.push(C.getFieldIsReqAtIdx("radius", i));

    if (errors.length > 0) {
      return {
        status: 400,
        errors,
      };
    }

    schools.push({ ...school, createdBy: userId });
  }

  const result = await School.create(schools);

  return {
    msg: `${result.length} schools successfully added.`,
  };
};

// ************************
// SCHOOL FUNCTIONS END
// ************************

// ************************
// STUDENT FUNCTIONS START
// ************************

const addMultipleStudents = async (userId, userType, fileData) => {
  const students = [];

  const errors = [];
  const admNoObj = {};
  const rfidObj = {};

  for (let i = 0; i < fileData.length; i++) {
    const row = fileData[i];

    if (!row.fname) errors.push(C.getFieldIsReqAtIdx("fname", i));
    if (!row.lname) errors.push(C.getFieldIsReqAtIdx("lname", i));

    const name = {
      f: row.fname,
      m: row.mname,
      l: row.lname,
    };

    if (!row.phone) errors.push(C.getFieldIsReqAtIdx("phone", i));
    if (!row.email) errors.push(C.getFieldIsReqAtIdx("email", i));

    if (!row.admissionNo) errors.push(C.getFieldIsReqAtIdx("admissionNo", i));
    // Store counts to check for duplication
    const admNo = row.admissionNo.toUpperCase();
    if (!admNoObj[admNo]) admNoObj[admNo] = 1;
    else admNoObj[admNo] += 1;

    if (!row.rfid) errors.push(C.getFieldIsReqAtIdx("rfid", i));
    // Store counts to check for duplication
    const rfid = row.rfid.toUpperCase();
    if (!rfidObj[rfid]) rfidObj[rfid] = 1;
    else rfidObj[rfid] += 1;

    if (!row.doa) errors.push(C.getFieldIsReqAtIdx("doa", i));
    if (isNaN(new Date(row.doa))) {
      errors.push(C.getFieldIsInvalidAtIdx("doa", i));
    }

    row.doa = new Date(row.doa + "T00:00:00Z");

    if (!row.dob) errors.push(C.getFieldIsReqAtIdx("dob", i));
    if (isNaN(new Date(row.dob))) {
      errors.push(C.getFieldIsInvalidAtIdx("dob", i));
    }

    row.dob = new Date(row.dob + "T00:00:00Z");

    if (!row.gender) errors.push(C.getFieldIsReqAtIdx("gender", i));
    if (!["m", "f", "o"].includes(row.gender)) {
      errors.push(C.getValueNotSupAtIdx(row.gender, i));
    }

    if (!row.school) errors.push(C.getFieldIsReqAtIdx("school", i));

    const school = await School.findOne({
      _id: row.school,
      createdBy: userId,
    })
      .select("_id")
      .lean();

    if (!school) errors.push(C.getResourse404Error("school", row.school));

    if (!row.bus) errors.push(C.getFieldIsReqAtIdx("bus", i));

    const bus = await Bus.findOne({
      _id: row.bus,
      createdBy: userId,
    })
      .select("_id")
      .lean();

    if (!bus) errors.push(C.getResourse404Error("bus", row.bus));

    if (!row.address) errors.push(C.getFieldIsReqAtIdx("address", i));
    if (!row.lat) errors.push(C.getFieldIsReqAtIdx("lat", i));
    if (!row.lon) errors.push(C.getFieldIsReqAtIdx("lon", i));
    if (!row.radius) errors.push(C.getFieldIsReqAtIdx("radius", i));

    const pickupLocation = {
      address: row.address,
      lat: row.lat,
      lon: row.lon,
      radius: row.radius,
    };

    const manager = [C.SUPERADMIN, C.ADMIN].includes(userType)
      ? row.manager
      : userId;

    if (!manager) errors.push(C.getFieldIsReqAtIdx("manager", i));

    students.push({
      name,
      phone: row.phone,
      email: row.email,
      rfid: row.rfid,
      admissionNo: row.admissionNo,
      doa: row.doa,
      dob: row.dob,
      gender: row.gender,
      school: row.school,
      bus: row.bus,
      pickupLocations: [pickupLocation],
      manager,
      createdBy: userId,
    });
  }

  for (const key of Object.keys(admNoObj)) {
    if (admNoObj[key] > 1) {
      errors.push(`Duplicate Values: admissionNo [${key}]`);
    }
  }

  for (const key of Object.keys(rfidObj)) {
    if (rfidObj[key] > 1) {
      errors.push(`Duplicate Values: admissionNo [${key}]`);
    }
  }

  if (errors.length > 0) {
    return {
      status: 400,
      errors,
    };
  }

  const result = await Student.create(students);

  return {
    msg: `${result.length} students successfully added.`,
  };
};

const getPersonName = (name) => {
  if (!name) return "";
  if (!name.f || !name.l) return "";

  let studentName = name.f;
  studentName += name.m ? ` ${name.m} ` : " ";
  studentName += name.l;

  return studentName;
};

const getStudentAddress = (address) => {
  if (!address) return "NA";
  let res = address.house + ", ";
  res += address.street + ", ";
  res += address.city + " " + address.pincode + ", ";
  res += address.pincode;

  return res;
};

// ************************
// STUDENT FUNCTIONS END
// ************************

// ************************
// BUS FUNCTIONS START
// ************************

const getBusIcon = (device) => {
  const timeout = parseInt(process.env.CONNECTION_TIMEOUT_MINUTES) * 60 * 1000;
  const dt_tracker = new Date(device.dt_tracker);
  const diff = new Date().getTime() - dt_tracker.getTime();
  const speed = parseFloat(device.speed);
  const ignition = device.params.io239 === "1";

  if (diff > timeout) {
    return `${process.env.DOMAIN}/images/bus_offline.png`;
  } else if (speed > 0) {
    return `${process.env.DOMAIN}/images/bus_moving.png`;
  } else if (speed === 0 && ignition) {
    return `${process.env.DOMAIN}/images/bus_idle.png`;
  } else if (speed === 0 && !ignition) {
    return `${process.env.DOMAIN}/images/bus_stopped.png`;
  } else return `${process.env.DOMAIN}/images/bus_idle.png`;
};

// ************************
// BUS FUNCTIONS END
// ************************

// ************************
// VALIDATION FUNCTIONS START
// ************************

const validateAndSetDate = (date, fieldName) => {
  const err = new Error();
  err.name = C.CUSTOMVALIDATION;

  if (!date) {
    err.message = C.getFieldIsReq(fieldName);
    throw err;
  }

  const date_ = new Date(date);

  if (isNaN(date_)) {
    err.message = fieldName + " is invalid!";
    throw err;
  }

  date_.setUTCHours(0, 0, 0, 0);

  return date_;
};

const validateSchool = async (user, school) => {
  const err = new Error();
  err.name = C.CUSTOMVALIDATION;

  if (C.isSchool(user.type)) school = user._id;

  if (!school) {
    err.message = C.getFieldIsReq("school");
    throw err;
  }

  if (!(await schoolAccExists(school))) {
    err.message = C.getResourse404Error("school", school);
    throw err;
  }

  return school;
};

const validateManagerAndSchool = async (user, manager, school) => {
  const err = new Error();
  err.name = C.CUSTOMVALIDATION;

  if (C.isSchool(user.type)) {
    school = user._id;
    manager = user.manager;
  } else if (C.isManager(user.type)) manager = user._id;

  if (!manager) {
    err.message = C.getFieldIsReq("manager");
    throw err;
  }

  if (!(await managerExists(manager))) {
    err.message = C.getResourse404Error("manager", manager);
    throw err;
  }

  if (!school) {
    err.message = C.getFieldIsReq("school");
    throw err;
  }

  if (!(await schoolAccExists(school, manager))) {
    err.message = C.getResourse404Error("school", school);
    throw err;
  }

  return [manager, school];
};

// ************************
// VALIDATION FUNCTIONS END
// ************************

// ************************
// DATE FUNCTIONS START
// ************************

const getYMD = (dt = new Date()) => {
  const now = new Date(dt);
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const date = now.getUTCDate();
  return "" + year + month + date;
};

const getDDMMYYYY = (dt = new Date()) => {
  const now = new Date(dt);
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const date = now.getUTCDate();

  return `${date}-${month}-${year}`;
};

const daysBetween = (startDate, endDate) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMilliseconds = Math.abs(end - start);
  const diffDays = Math.round(diffMilliseconds / oneDay);
  return diffDays;
};

// ************************
// DATE FUNCTIONS END
// ************************

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

const rad2deg = (rad) => {
  return rad * (180 / Math.PI);
};

const getAngle = (lat1, lng1, lat2, lng2) => {
  const dLng = deg2rad(lng2) - deg2rad(lng1);
  const y = Math.sin(dLng) * Math.cos(deg2rad(lat2));
  const x =
    Math.cos(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) -
    Math.sin(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(dLng);
  const angle = (rad2deg(Math.atan2(y, x)) + 360) % 360;

  return Math.floor(angle);
};

const getLenBtwPointsInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const isPointInCircle = (lat1, lon1, lat2, lon2, radius) => {
  const distance = getLenBtwPointsInKm(lat1, lon1, lat2, lon2) * 1000;
  return distance <= radius;
};

const isPointInPolygon = (vertices, lat, lng) => {
  const polyLng = vertices.map((vertex) => vertex.lng);
  const polyLat = vertices.map((vertex) => vertex.lat);

  // vertices = vertices.split(",");
  // vertices = vertices.map((vertex) => parseFloat(vertex));

  // check for all X and Y
  // if (vertices.length % 2 !== 0) vertices.pop();

  let polyVertices = polyLat.length;
  // let i = 0;

  // while (i < vertices.length) {
  //   polyLat.push(vertices[i]);
  //   polyLng.push(vertices[i + 1]);

  //   i += 2;
  //   polyVertices++;
  // }

  let j = polyVertices - 1;
  let oddNodes = false;

  for (let i = 0; i < polyVertices; i++) {
    if (
      (polyLat[i] < lat && polyLat[j] >= lat) ||
      (polyLat[j] < lat && polyLat[i] >= lat)
    ) {
      if (
        polyLng[i] +
          ((lat - polyLat[i]) / (polyLat[j] - polyLat[i])) *
            (polyLng[j] - polyLng[i]) <
        lng
      ) {
        oddNodes = !oddNodes;
      }
    }
    j = i;
  }

  return oddNodes;
};

const getAppRootDir = (currentDir) => {
  while (!fs.existsSync(path.join(currentDir, "package.json"))) {
    currentDir = path.join(currentDir, "..");
  }
  return currentDir;
};

const writeLog = (name, data) => {
  const now = new Date();
  const date = new Date().getUTCDate();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0"); // months from 1-12
  const year = now.getUTCFullYear();

  const logDir = path.join(getAppRootDir(__dirname), "logs", name);

  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const logFile = path.join(logDir, `${name}_${year}-${month}-${date}.log`);

  let str = `[${new Date().toISOString().replace("T", " ").split(".")[0]}] `;

  str += "=> " + data + "\n";

  try {
    fs.appendFileSync(logFile, str);
  } catch (err) {
    console.log(err);
  }
};

const convUTCTo0530 = (date) => {
  let hours = 5,
    minutes = 30;

  const currDt = new Date(date);
  const currHours = currDt.getUTCHours();
  const currMin = currDt.getUTCMinutes();
  const currSec = currDt.getUTCSeconds();
  const currMSec = currDt.getUTCMilliseconds();

  const dt = new Date(
    currDt.setUTCHours(currHours + hours, currMin + minutes, currSec, currMSec)
  );

  const dtStr = dt.toISOString();

  hours = String(hours).padStart(2, "0");
  minutes = String(minutes).padStart(2, "0");

  return dtStr.replace("Z", `+${hours}:${minutes}`);
};

const formatDateToAMPM = (dateTime) => {
  const dt = new Date(dateTime);

  if (dt.getTime() === 0) return "NA";

  const Y = String(dt.getUTCFullYear()).padStart(2, "0");
  const M = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const D = String(dt.getUTCDate()).padStart(2, "0");
  const h_ = dt.getUTCHours();
  const h = String(h_ > 12 ? h_ - 12 : h_).padStart(2, "0");
  const m = String(dt.getUTCMinutes()).padStart(2, "0");
  const s = String(dt.getUTCSeconds()).padStart(2, "0");
  const postFix = h_ > 11 ? "PM" : "AM";

  return `${D}-${M}-${Y.slice(2, 4)} ${h}:${m}:${s} ${postFix}`;
};

module.exports = {
  createSearchQuery,
  paginatedQuery,
  excelToJson,

  getUsernameFromEmail,
  managerExists,
  schoolAccExists,

  getCurrentAcademicYear,
  addMultipleSchools,

  addMultipleStudents,
  getPersonName,
  getStudentAddress,

  getBusIcon,

  validateAndSetDate,
  validateSchool,
  validateManagerAndSchool,

  getYMD,
  getDDMMYYYY,
  daysBetween,

  getAngle,
  getLenBtwPointsInKm,
  isPointInCircle,
  isPointInPolygon,

  getAppRootDir,
  writeLog,

  convUTCTo0530,
  formatDateToAMPM,
};
