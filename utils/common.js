const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const xlsx = require("xlsx");

const C = require("../constants");
const School = require("../models/system/schoolModel");
const Bus = require("../models/transport/busModel");
const Student = require("../models/studentInfo/studentModel");
const { isUsernameValid } = require("./validators");

const User = require("../models/system/userModel");
const FeeTerm = require("../models/fees/feeTermModel");
const Class = require("../models/academics/classModel");
const Stream = require("../models/academics/streamModel");
const BoardingType = require("../models/studentInfo/boardingTypeModel");
const BusStop = require("../models/transport/busStopModel");
const BusStaff = require("../models/transport/busStaffModel");
const Section = require("../models/academics/sectionModel");
const Subject = require("../models/academics/subjectModel");

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

const getUserContactInfo = async (usertypes, ids = []) => {
  usertypes = usertypes.map((ele) => ele.toLowerCase());

  const result = [];
  const query = {};

  if (ids.length > 0) query._id = ids;

  for (const ut of usertypes) {
    if (ut == C.STUDENT) {
      const students = await Student.find(query).select("email phone").lean();

      result.push(...students);
    }

    query.type = ut;
    const users = await User.find(query).select("email phone").lean();

    result.push(...users);
  }

  return result;
};

// ************************
// USER FUNCTIONS END
// ************************

// ************************
// SCHOOL FUNCTIONS START
// ************************

const getCurrentAcademicYear = (school) => {
  if (!school) {
    const err = new Error("school is undefined!");
    err.name = C.CUSTOMVALIDATION;
    throw err;
  }

  if (!school.current_academic_year) {
    const err = new Error(C.CUR_AYEAR_NOT_SET);
    err.name = C.CUSTOMVALIDATION;
    throw err;
  }

  return school.current_academic_year;
};

const getLibraryVariables = async (schoolId) => {
  const school = await School.findById(schoolId).select("library").lean();

  if (!school) {
    const err = new Error(C.getResourse404Id("School", schoolId));
    err.name = C.CUSTOMVALIDATION;
    throw err;
  }

  return school.library;
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

    if (!school) errors.push(C.getResourse404Id("school", row.school));

    if (!row.bus) errors.push(C.getFieldIsReqAtIdx("bus", i));

    const bus = await Bus.findOne({
      _id: row.bus,
      createdBy: userId,
    })
      .select("_id")
      .lean();

    if (!bus) errors.push(C.getResourse404Id("bus", row.bus));

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
// BUS-STOP FUNCTIONS START
// ************************

const addMultipleBusStops = async (data, school) => {
  const stops = [];
  const errors = [];

  let i = 1;
  for (const row of data) {
    if (!row.name) errors.push(C.getFieldIsReqAtIdx("name", i));
    if (!row.address) errors.push(C.getFieldIsReqAtIdx("address", i));
    if (!row.fare && row.fare !== 0)
      errors.push(C.getFieldIsReqAtIdx("fare", i));
    if (!row.lat && row.lat !== 0) errors.push(C.getFieldIsReqAtIdx("lat", i));
    if (!row.lon && row.lon !== 0) errors.push(C.getFieldIsReqAtIdx("lon", i));

    row.name = row.name.toUpperCase();

    if (stops.find((s) => s.name === row.name)) {
      errors.push(`Duplicate Values: name [${row.name}]`);
    }

    stops.push({
      name: row.name,
      address: row.address,
      fare: row.fare,
      lat: parseFloat(row.lat).toFixed(6),
      lon: parseFloat(row.lon).toFixed(6),
      school: school._id,
    });

    i++;
  }

  if (errors.length > 0) return errors;

  const busStops = [];
  for (const stop of stops) {
    if (await BusStop.any({ name: stop.name })) {
      const update = await BusStop.updateOne(
        { name: stop.name },
        {
          $set: {
            address: stop.address,
            fare: stop.fare,
            lat: parseFloat(stop.lat).toFixed(6),
            lon: parseFloat(stop.lon).toFixed(6),
          },
        }
      );

      busStops.push({ name: stop.name, msg: update });
    } else {
      const busStop = await BusStop.create(stop);

      busStops.push(busStop._id);
    }
  }

  return busStops;
};

// ************************
// BUS-STOP FUNCTIONS END
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

const getBusDevice = async (bus) => {
  if (!bus.temp_device || !bus.temp_device.enabled) return bus.device;

  const tempBus = await Bus.findOne({ "device.imei": bus.temp_device.imei })
    .select("device")
    .lean();

  return tempBus ? tempBus.device : bus.device;
};

const addMultipleBuses = async (data, school) => {
  const buses = [];
  const errors = [];

  const BUS_STOPS = await BusStop.find({ school: school._id })
    .select("name")
    .lean();

  const DRIVERS = await BusStaff.find({ type: "d", school: school._id })
    .select("name")
    .lean();

  const CONDUCTORS = await BusStaff.find({ type: "c", school: school._id })
    .select("name")
    .lean();

  let i = 1;
  for (const row of data) {
    if (!row.name) errors.push(C.getFieldIsReqAtIdx("name", i));
    if (!row.no_plate) errors.push(C.getFieldIsReqAtIdx("no_plate", i));
    if (!row.model) errors.push(C.getFieldIsReqAtIdx("model", i));
    if (!row.imei) errors.push(C.getFieldIsReqAtIdx("imei", i));
    if (!row.bus_stops) errors.push(C.getFieldIsReqAtIdx("bus_stops", i));
    if (!row.driver) errors.push(C.getFieldIsReqAtIdx("driver", i));
    if (!row.conductor) errors.push(C.getFieldIsReqAtIdx("conductor", i));

    const name = String(row.name).toUpperCase();
    const no_plate = String(row.no_plate).toUpperCase();
    const model = String(row.model).toUpperCase();
    const busStops = row.bus_stops.split("|");
    const driverName = row.driver.toUpperCase();
    const conductorName = row.conductor.toUpperCase();

    if (buses.find((b) => b.name === name)) {
      errors.push(`Duplicate Values: name [${row.name}]`);
    }

    if (buses.find((b) => b.device.imei === row.imei)) {
      errors.push(`Duplicate Values: device [${row.device}]`);
    }

    if (busStops.length === 0) {
      errors.push(C.getFieldIsReqAtIdx("bus_stops", i));
    }

    const stops = [];
    for (const sname of busStops) {
      const stop = BUS_STOPS.find((s) => s.name === sname);
      if (!stop) {
        errors.push(
          `Bus Stop [${sname}] at row ${i} does not exists in database!`
        );
      } else {
        stops.push(stop._id);
      }
    }

    const driver = DRIVERS.find((d) => d.name === driverName);
    if (!driver) {
      errors.push(`Driver [${driverName}] doesn't exists in database!`);
    }

    const conductor = CONDUCTORS.find((c) => c.name === conductorName);
    if (!conductor) {
      errors.push(`Conductor [${conductorName}] doesn't exists in database!`);
    }

    buses.push({
      name,
      no_plate,
      model,
      device: { imei: row.imei },
      stops,
      driver: driver._id,
      conductor: conductor._id,
      school: school._id,
    });

    i++;
  }

  if (errors.length > 0) return errors;

  const result = [];
  for (const bus of buses) {
    if (await Bus.any({ name: bus.name })) {
      const update = await Bus.updateOne(
        { name: bus.name },
        {
          $set: {
            address: bus.address,
            fare: bus.fare,
            lat: parseFloat(bus.lat).toFixed(6),
            lon: parseFloat(bus.lon).toFixed(6),
          },
        }
      );

      result.push({ name: bus.name, msg: update });
    } else {
      const newBus = await Bus.create(bus);

      result.push(newBus._id);
    }
  }

  return result;
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

const validateManagerAndSchool = async (user, manager, school) => {
  if (C.isSchool(user.type)) {
    school = user.school;
    manager = user.manager;
  } else if (C.isManager(user.type)) manager = user._id;

  if (!manager) {
    const err = new Error(C.getFieldIsReq("manager"));
    err.name = C.CUSTOMVALIDATION;
    throw err;
  }

  if (!(await managerExists(manager))) {
    const err = new Error(C.getResourse404Id("manager", manager));
    err.name = C.CUSTOMVALIDATION;
    throw err;
  }

  if (!school) {
    const err = new Error(C.getFieldIsReq("school"));
    err.name = C.CUSTOMVALIDATION;
    throw err;
  }

  if (!(await School.any({ _id: school, manager }))) {
    const err = new Error(C.getResourse404Id("school", school));
    err.name = C.CUSTOMVALIDATION;
    throw err;
  }

  return [manager, school];
};

const validateManager = async (user, manager) => {
  if (C.isManager(user.type)) manager = user._id;

  if (!manager) {
    const err = new Error(C.getFieldIsReq("manager"));
    err.name = C.CUSTOMVALIDATION;
    throw err;
  }

  if (!(await managerExists(manager))) {
    const err = new Error(C.getResourse404Id("manager", manager));
    err.name = C.CUSTOMVALIDATION;
    throw err;
  }

  return manager;
};

const validateSchool = async (user, school) => {
  if (C.isSchool(user.type)) school = user.school;

  if (!school) {
    const err = new Error(C.getFieldIsReq("school"));
    err.name = C.CUSTOMVALIDATION;
    throw err;
  }

  if (!(await School.any({ _id: school }))) {
    const err = new Error(C.getResourse404Id("school", school));
    err.name = C.CUSTOMVALIDATION;
    throw err;
  }

  return school;
};

const validateFeeTerms = async (feeTerms, academic_year) => {
  if (!feeTerms || feeTerms.length === 0) {
    throwCustomValidationErr(C.getFieldIsReq("fee_terms"));
  }

  const result = [];

  for (const name of feeTerms) {
    const ft = await FeeTerm.findOne({
      name: name.toUpperCase(),
      academic_year,
    })
      .select("_id")
      .lean();

    if (!ft) throwCustomValidationErr(C.getResourse404Id("fee_terms", name));

    result.push(ft._id);
  }

  return result;
};

const validateClasses = async (classes, academic_year) => {
  if (!classes || classes.length === 0) {
    throwCustomValidationErr(C.getFieldIsReq("classes"));
  }

  const result = [];

  for (const name of classes) {
    const c = await Class.findOne({ name: name.toUpperCase(), academic_year })
      .select("_id")
      .lean();

    if (!c) {
      throwCustomValidationErr(C.getResourse404Id("classes", name));
    }

    result.push(c._id);
  }

  return result;
};

const validateSections = async (sections, academic_year) => {
  if (!sections || sections.length === 0) {
    throwCustomValidationErr(C.getFieldIsReq("sections"));
  }

  const result = [];

  for (const name of sections) {
    const c = await Section.findOne({ name: name.toUpperCase(), academic_year })
      .select("_id")
      .lean();

    if (!c) throwCustomValidationErr(C.getResourse404Id("sections", name));

    result.push(c._id);
  }

  return result;
};

const validateStreams = async (streams, academic_year) => {
  if (!streams || streams.length === 0) streams = ["NA"];

  if (!streams.map((e) => e.toUpperCase()).includes("NA")) streams.push("NA");

  const result = [];
  for (const name of streams) {
    const s = await Stream.findOne({ name: name.toUpperCase(), academic_year })
      .select("_id")
      .lean();

    if (!s) throwCustomValidationErr(C.getResourse404Id("streams", name));

    result.push(s._id);
  }

  return result;
};

const validateBoardingTypes = async (boardingTypes) => {
  if (!boardingTypes || boardingTypes.length === 0) {
    throwCustomValidationErr(C.getFieldIsReq("boarding_types"));
  }

  const result = [];

  for (const name of boardingTypes) {
    const bt = await BoardingType.findOne({ name: name.toUpperCase() })
      .select("_id")
      .lean();

    if (!bt) {
      throwCustomValidationErr(C.getResourse404Id("boarding_types", name));
    }

    result.push(bt._id);
  }

  return result;
};

const validateBusStops = async (stops) => {
  if (!stops || stops.length === 0) {
    throwCustomValidationErr(C.getFieldIsReq("stops"));
  }

  const result = [];

  for (const name of stops) {
    const stop = await BusStop.findOne({ name: name.toUpperCase() })
      .select("_id")
      .lean();

    if (!stop) {
      throwCustomValidationErr(C.getResourse404Id("stops", name));
    }

    result.push(stop._id);
  }

  return result;
};

const validateClassByName = async (className, academic_year) => {
  if (!className) {
    throwCustomValidationErr(C.getFieldIsReq("class"));
  }

  const c = await Class.findOne({
    name: className.toUpperCase(),
    academic_year,
  })
    .select("_id")
    .lean();

  if (!c) throwCustomValidationErr(C.getResourse404Id("class", className));

  return c._id;
};

const validateSectionByName = async (sectionName, academic_year) => {
  if (!sectionName) {
    throwCustomValidationErr(C.getFieldIsReq("section"));
  }

  const section = await Section.findOne({
    name: sectionName.toUpperCase(),
    academic_year,
  })
    .select("_id")
    .lean();

  if (!section)
    throwCustomValidationErr(C.getResourse404Id("section", sectionName));

  return section._id;
};

const validateSubjectByName = async (subjectName, academic_year) => {
  if (!subjectName) {
    throwCustomValidationErr(C.getFieldIsReq("subject"));
  }

  const subject = await Subject.findOne({
    name: subjectName.toUpperCase(),
    academic_year,
  })
    .select("_id")
    .lean();

  if (!subject)
    throwCustomValidationErr(C.getResourse404Id("subject", subjectName));

  return subject._id;
};

const throwCustomValidationErr = (msg) => {
  const e = new Error(msg);
  e.name = C.CUSTOMVALIDATION;
  throw e;
};

// ************************
// VALIDATION FUNCTIONS END
// ************************

// ************************
// DATE FUNCTIONS START
// ************************

const getYMD = (dt = new Date()) => {
  const now = new Date(dt);

  if (now.getTime() === 0) return "NA";

  const Y = String(now.getUTCFullYear()).padStart(2, "0");
  const M = String(now.getUTCMonth() + 1).padStart(2, "0");
  const D = String(now.getUTCDate()).padStart(2, "0");

  return Y + M + D;
};

const getDDMMYYYY = (dt = new Date()) => {
  const now = new Date(dt.toISOString().replace("Z", "-05:30"));

  if (now.getTime() === 0) return "NA";

  const Y = String(now.getUTCFullYear()).padStart(2, "0");
  const M = String(now.getUTCMonth() + 1).padStart(2, "0");
  const D = String(now.getUTCDate()).padStart(2, "0");

  return `${D}-${M}-${Y}`;
};

const getDDMMYYYYwithTime = (dt = new Date()) => {
  const now = new Date(dt.toISOString().replace("Z", "-05:30"));

  if (now.getTime() === 0) return "NA";

  const Y = String(now.getUTCFullYear()).padStart(2, "0");
  const M = String(now.getUTCMonth() + 1).padStart(2, "0");
  const D = String(now.getUTCDate()).padStart(2, "0");
  const h_ = now.getUTCHours();
  const h = String(h_ > 12 ? h_ - 12 : h_).padStart(2, "0");
  const m = String(now.getUTCMinutes()).padStart(2, "0");
  const s = String(now.getUTCSeconds()).padStart(2, "0");
  const postFix = h_ > 11 ? "PM" : "AM";

  return `${D}-${M}-${Y} ${h}:${m}:${s} ${postFix}`;
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

const generateApiKey = () => crypto.randomBytes(32).toString("hex");

module.exports = {
  createSearchQuery,
  paginatedQuery,
  excelToJson,

  getUsernameFromEmail,
  managerExists,
  schoolAccExists,
  getUserContactInfo,

  getCurrentAcademicYear,
  getLibraryVariables,
  addMultipleSchools,

  addMultipleStudents,
  getStudentAddress,

  addMultipleBusStops,

  getBusIcon,
  getBusDevice,
  addMultipleBuses,

  validateAndSetDate,
  validateManagerAndSchool,
  validateManager,
  validateSchool,
  validateFeeTerms,
  validateClasses,
  validateSections,
  validateStreams,
  validateBoardingTypes,
  validateBusStops,
  validateClassByName,
  validateSectionByName,
  validateSubjectByName,

  getYMD,
  getDDMMYYYY,
  getDDMMYYYYwithTime,
  daysBetween,

  getAngle,
  getLenBtwPointsInKm,
  isPointInCircle,
  isPointInPolygon,

  getAppRootDir,
  writeLog,

  convUTCTo0530,
  formatDateToAMPM,

  generateApiKey,
};
