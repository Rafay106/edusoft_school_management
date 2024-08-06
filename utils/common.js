const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert");
const xlsx = require("xlsx");

const C = require("../constants");
const Role = require("../models/system/roleModel");
const RolePrivilege = require("../models/system/rolePrivilegeModel");
const School = require("../models/system/schoolModel");
const Shift = require("../models/hr/shiftModel");
const Bus = require("../models/transport/busModel");
const Student = require("../models/studentInfo/studentModel");
const User = require("../models/system/userModel");
const FeeTerm = require("../models/fees/feeTermModel");
const Class = require("../models/academics/classModel");
const Stream = require("../models/academics/streamModel");
const BoardingType = require("../models/studentInfo/boardingTypeModel");
const BusStop = require("../models/transport/busStopModel");
const BusStaff = require("../models/transport/busStaffModel");
const Section = require("../models/academics/sectionModel");
const Subject = require("../models/academics/subjectModel");
const Staff = require("../models/hr/staffModel");
const SubWard = require("../models/studentInfo/subwardTypeModel");
const Lesson = require("../models/lesson_plan/lessonModel");
const Device = require("../models/system/deviceModel");
const Department = require("../models/hr/departmentModel");
const Designation = require("../models/hr/designationModel");
const Bank = require("../models/account/bankModel");
const Homework = require("../models/tution/homeworksModel");
const { isEmailValid } = require("./validators");
const Chart = require("../models/account/chartModel");
const FeeType = require("../models/fees/feeTypeModel");

const createSearchQuery = (fields, value) => {
  const orArr = [];

  for (const field of fields) {
    orArr.push({
      [field]: { $regex: value, $options: "i" },
    });
  }

  return orArr;
};

const paginatedArrayQuery = (
  array,
  page,
  limit,
  sortFn = false,
  queryFn = false,
  selectFn = false
) => {
  const filteredArray = queryFn ? array.filter(queryFn) : array;

  const total = filteredArray.length;
  const pages = Math.ceil(total / limit) || 1;
  if (page > pages) return false;

  const startIdx = (page - 1) * limit;

  let paginatedResults = filteredArray.slice(startIdx, startIdx + limit);

  if (selectFn) paginatedResults = paginatedResults.map(selectFn);

  if (sortFn) paginatedResults = paginatedResults.sort(sortFn);

  const results = {
    total,
    pages,
    page,
    result: paginatedResults,
  };

  return results;
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
  const results = { total, pages, page, result: [] };

  results.result = await Model.find(query)
    .select(select)
    .skip(startIdx)
    .limit(limit)
    .populate(populate[0], populate[1])
    .sort(sort)
    .lean();

  return results;
};

const paginatedQueryProPlus = async (
  Model,
  query,
  select,
  page,
  limit,
  sort,
  populateConfigs = []
) => {
  const total = await Model.countDocuments(query);
  const pages = Math.ceil(total / limit) || 1;
  if (page > pages) return false;

  const startIdx = (page - 1) * limit;
  const results = { total, pages, page, result: [] };

  let mongoQuery = Model.find(query).select(select).skip(startIdx).limit(limit);

  populateConfigs.forEach((config) => {
    mongoQuery = mongoQuery.populate(config);
  });

  results.result = await mongoQuery.sort(sort).lean();

  return results;
};

const excelToJson = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  return data;
};

const jsonToExcel = (filePath, data) => {
  const workbook = xlsx.utils.book_new();

  const worksheet = xlsx.utils.json_to_sheet(data);

  xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  xlsx.writeFile(workbook, filePath);

  return true;
};

const getRoleId = async (title) => {
  assert(title !== undefined, C.getFieldIsReq("title"));

  const role = await Role.findOne({ title }).select("title").lean();

  if (!role) return false;

  return role._id;
};

const getRolePrivilegeId = async (role) => {
  assert(role !== undefined, C.getFieldIsReq("role"));

  const privilege = await RolePrivilege.findOne({ role }).select("role").lean();

  if (!privilege) return false;

  return privilege._id;
};

// ************************
// BANK FUNCTIONS START
// ************************

const getBankFromName = async (name, select = "_id") => {
  const bank = await Bank.findOne({ name: name.toUpperCase() })
    .select(select)
    .lean();

  if (!bank) throw new Error(C.getResourse404Id("Bank", name));

  return bank;
};

// ************************
// BANK FUNCTIONS END
// ************************

// ************************
// USER FUNCTIONS START
// ************************

const isSuperAdmin = (user) => {
  assert(user !== undefined, C.getFieldIsReq("user"));
  assert(user.role !== undefined, C.getFieldMissing("user.role"));
  assert(user.role.title !== undefined, C.getFieldMissing("user.role.title"));

  return user.role.title === C.SUPERADMIN;
};

const isAdmin = (user) => {
  assert(user !== undefined, C.getFieldIsReq("user"));
  assert(user.role !== undefined, C.getFieldMissing("user.role"));
  assert(user.role.title !== undefined, C.getFieldMissing("user.role.title"));

  return user.role.title === C.ADMIN;
};

const isAdmins = (user) => {
  assert(user !== undefined, C.getFieldIsReq("user"));
  assert(user.role !== undefined, C.getFieldMissing("user.role"));
  assert(user.role.title !== undefined, C.getFieldMissing("user.role.title"));

  return [C.SUPERADMIN, C.ADMIN].includes(user.role.title);
};

const isSchool = (user) => {
  assert(user !== undefined, C.getFieldIsReq("user"));
  assert(user.role !== undefined, C.getFieldMissing("user.role"));
  assert(user.role.title !== undefined, C.getFieldMissing("user.role.title"));

  return [C.SCHOOL].includes(user.role.title);
};

const isParent = (user) => {
  assert(user !== undefined, C.getFieldIsReq("user"));
  assert(user.role !== undefined, C.getFieldMissing("user.role"));
  assert(user.role.title !== undefined, C.getFieldMissing("user.role.title"));

  return [C.PARENT].includes(user.role.title);
};

const isTeacher = (user) => {
  assert(user !== undefined, C.getFieldIsReq("user"));
  assert(user.role !== undefined, C.getFieldMissing("user.role"));
  assert(user.role.title !== undefined, C.getFieldMissing("user.role.title"));

  return [C.TEACHER].includes(user.role.title);
};

const getUsernameFromEmail = (email) => {
  const username = require("unique-username-generator").generateFromEmail(
    email
  );

  const maxLen = 22;

  if (username.length >= maxLen) return username.slice(0, maxLen - 1);

  return username;
};

const schoolAccExists = async (_id) => await User.any({ _id, type: C.SCHOOL });

const getUserContactInfo = async (usertypes, ids = []) => {
  usertypes = usertypes.map((ele) => ele.toLowerCase());

  const result = [];

  for (const ut of usertypes) {
    const query = {};
    if (ids.length > 0) query._id = { $in: ids };

    if (ut == C.STUDENT) {
      const students = await Student.find(query).select("email phone").lean();

      result.push(...students);
    } else {
      const roleId = await getRoleId(ut);
      if (!roleId) return result;
      query.role = roleId;

      const users = await User.find(query).select("email phone").lean();

      result.push(...users);
    }
  }

  return result;
};

// ************************
// USER FUNCTIONS END
// ************************

// ************************
// SCHOOL FUNCTIONS START
// ************************

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

const addMultipleStudents = async (fileData, school, ayear) => {
  const CLASSES = await Class.find().lean();
  const SECTIONS = await Section.find().lean();
  const STREAMS = await Stream.find().lean();
  const BOARDINGTYPES = await BoardingType.find().lean();
  const SUBWARDS = await SubWard.find().lean();
  const BUSSES = await Bus.find().lean();
  const BUSSTOPS = await BusStop.find().lean();

  const naStream = STREAMS.find((s) => s.name === "NA");
  const naBoarding = BOARDINGTYPES.find((s) => s.name === "NA");
  const naSubward = SUBWARDS.find((s) => s.name === "NA");

  const students = [];
  const errors = [];

  let i = 1;
  for (const row of fileData) {
    if (!row.admission_no) errors.push(C.getFieldIsReqAtIdx("name", i));
    if (!row.name) errors.push(C.getFieldIsReqAtIdx("name", i));
    if (!row.class) errors.push(C.getFieldIsReqAtIdx("class", i));
    if (!row.section) errors.push(C.getFieldIsReqAtIdx("section", i));
    if (!row.admission_time_class)
      errors.push(C.getFieldIsReqAtIdx("admission_time_class", i));
    if (!row.doa) errors.push(C.getFieldIsReqAtIdx("doa", i));
    if (!row.student_status)
      errors.push(C.getFieldIsReqAtIdx("student_status", i));
    if (!row.phone) errors.push(C.getFieldIsReqAtIdx("phone", i));
    if (!row.dob) errors.push(C.getFieldIsReqAtIdx("dob", i));

    if (students.find((ele) => ele.admission_no === row.admission_no)) {
      errors.push(`Duplicate admissionNo [${row.admission_no}] at row: ${i}`);
    }

    row.doa = excelDateToJSDate(row.doa);
    row.dob = excelDateToJSDate(row.dob);

    row.phone = String(row.phone);

    if (row.phone.length !== 10) {
      row.phone = "9123123123";
      // errors.push(`phone number shoud be of 10 digits at row: ${i}`);
    }

    const section = SECTIONS.find((s) => s.name === row.section);

    let stream;
    if (row.stream) {
      stream = STREAMS.find((s) => s.name === row.stream);
      if (!stream) errors.push(`stream not found at row: ${i}`);
    } else stream = naStream;

    let cStream = stream ? stream._id : naStream._id;
    // console.log("cStream", cStream);
    const class_ = CLASSES.find((C) => {
      // console.log("C.stream === cStream", C.stream.equals(cStream));
      if (C.name === row.class && C.stream.equals(cStream)) return true;
      else return false;
    });

    console.log(row.class, ":", class_.name);

    const atclass = CLASSES.find((c) => c.name === row.admission_time_class);

    const boardingType =
      BOARDINGTYPES.find((bt) => bt.name === row.boarding_type) || naBoarding;

    const subward =
      SUBWARDS.find((sw) => sw.name === row.sub_ward) || naSubward;

    const bus_pick = BUSSES.find((b) => b.name === row.bus_pick);
    if (row.bus_pick && !bus_pick) {
      errors.push(`bus_pick not found at row: ${i}`);
    }

    const bus_drop = BUSSES.find((b) => b.name === row.bus_drop);
    if (row.bus_drop && !bus_drop) {
      errors.push(`bus_drop not found at row: ${i}`);
    }

    const busStop = BUSSTOPS.find((bs) => bs.name === row.stop);
    if (row.stop && !busStop) {
      errors.push(`stop not found at row: ${i}`);
    }

    const email =
      row["Email ID"] == "N/A" || !row["Email ID"]
        ? row.admission_no.replace("/", "_") + "@email.com"
        : row["Email ID"];

    const student = {
      admission_no: row.admission_no,
      admission_serial: row.admission_serial,
      student_id: row.student_id,
      roll_no: row.roll_no,
      name: row.name,
      class: class_._id,
      section: section._id,
      stream: stream?._id,
      admission_time_class: atclass?._id,
      gender: !row.gender ? "na" : row.gender === "MALE" ? "m" : "f",
      house: row.house,
      blood_group: row.blood_group == "NONE" ? "na" : row.blood_group,
      staff_child: row.staff_child,
      doa: row.doa,
      student_status: row.student_status === "New" ? "n" : "o",
      student_left: row.student_left === "Yes",
      phone: row.phone ? row.phone : "9123123123",
      father_details: {
        name: row.father_name,
        phone: row.father_phone,
        designation: row.father_designation,
        office_address: row.father_office,
        job_title: row.father_job,
        adhaar: row.father_adhaar,
      },
      mother_details: {
        name: row.mother_name,
        phone: row.mother_phone,
        job_title: row.mother_job,
        adhaar: row.mother_adhaar,
      },
      dob: row.dob,
      age: row.age,
      address: {
        permanent: row.permanent_address,
        correspondence: row.correspondence_address,
      },
      religion: row.religion,
      cast: row.cast === "GENERAL" ? "GEN" : row.cast,
      boarding_type: boardingType._id,
      sub_ward: subward._id,
      student_club: row.student_club,
      student_work_exp: row.student_work_exp,
      language_2nd: row.language_2nd,
      language_3rd: row.language_3rd,
      exam_subjects: {
        one: row.exam_sub1,
        two: row.exam_sub2,
        three: row.exam_sub3,
        four: row.exam_sub4,
        five: row.exam_sub5,
        six: row.exam_sub6,
        seven: row.exam_sub7,
        eigth: row.exam_sub8,
        nine: row.exam_sub9,
        ten: row.exam_sub10,
      },
      ews_applicable: row.ews_applicable === "Yes",
      bank_details: {
        name: row.bankname,
        account_type: row.account_type,
        account_holder: row.account_holder,
        account_no: row.account_no,
        ifsc: row.ifsc,
      },
      relation_with_student: row.relation_with_student,
      class_teacher: row.class_teacher,
      bus_pick: bus_pick ? bus_pick._id : undefined,
      bus_drop: bus_drop ? bus_drop._id : undefined,
      bus_stop: busStop ? busStop._id : undefined,
      student_adhaar: row.student_adhaar,
      sibling: row.sibling === "Yes",
      single_girl_child: row.single_girl_child === "Yes",
      handicapped: row.handicapped === "Yes",
      email,
      photo: row.admission_no.replace("/", "") + ".jpg",
      rfid: crypto.randomBytes(10).toString("hex"),
      academic_year: ayear,
      school: school._id,
    };

    students.push(student);

    i++;
  }

  // return errors.length ? errors : students;

  if (errors.length > 0) return errors;

  const results = [];
  for (const stuData of students) {
    if (await Student.any({ admission_no: stuData.admission_no })) {
      const update = await Student.updateOne(
        { admission_no: stuData.admission_no },
        { $set: { ...stuData, rfid: undefined } }
      );

      results.push({ admission_no: stuData.admission_no, msg: update });
    } else {
      const student = await Student.create(stuData);
      results.push(student);
    }
  }

  return results;
};

const addMultipleStudentsDPS = async (fileData, school, ayear) => {
  const CLASSES = await Class.find().lean();
  const SECTIONS = await Section.find().lean();
  const STREAMS = await Stream.find().lean();
  const BOARDINGTYPES = await BoardingType.find().lean();
  const SUBWARDS = await SubWard.find().lean();
  const BUSSES = await Bus.find().lean();
  const BUSSTOPS = await BusStop.find().lean();

  const naStream = STREAMS.find((s) => s.name === "NA");
  const naBoarding = BOARDINGTYPES.find((s) => s.name === "NA");
  const naSubward = SUBWARDS.find((s) => s.name === "NA");

  const students = [];
  const errors = [];

  let i = 1;
  for (const row of fileData) {
    if (!row["Adm. No."]) errors.push(C.getFieldIsReqAtIdx("name", i));
    if (!row["Student Name"]) errors.push(C.getFieldIsReqAtIdx("name", i));
    if (!row["Class"]) errors.push(C.getFieldIsReqAtIdx("class", i));
    if (!row["Section"]) errors.push(C.getFieldIsReqAtIdx("section", i));
    if (!row["Admission Time Class"])
      errors.push(C.getFieldIsReqAtIdx("admission_time_class", i));
    if (!row["Adm. Date"]) errors.push(C.getFieldIsReqAtIdx("doa", i));
    if (!row["Student Status"])
      errors.push(C.getFieldIsReqAtIdx("student_status", i));
    // if (!row["Communication Mobile No"]) errors.push(C.getFieldIsReqAtIdx("phone", i));
    if (!row["Date of Birth"]) errors.push(C.getFieldIsReqAtIdx("dob", i));

    if (students.find((ele) => ele.admission_no === row["Adm. No."])) {
      errors.push(`Duplicate admissionNo [${row["Adm. No."]}] at row: ${i}`);
    }

    row["Adm. Date"] = excelDateToJSDate(row["Adm. Date"]);
    row["Date of Birth"] = excelDateToJSDate(row["Date of Birth"]);

    row["Communication Mobile No"] = String(row["Communication Mobile No"]);

    if (row["Communication Mobile No"].length !== 10) {
      row["Communication Mobile No"] = "9123123123";
      // errors.push(`phone number shoud be of 10 digits at row: ${i}`);
    }

    const section = SECTIONS.find((s) => s.name === row["Section"]);

    let stream;
    if (row["Stream"]) {
      stream = STREAMS.find((s) => s.name === row["Stream"]);
      if (!stream) errors.push(`stream not found at row: ${i}`);
    } else stream = naStream;

    let cStream = stream ? stream._id : naStream._id;
    const class_ = CLASSES.find((C) => {
      if (C.name === row["Class"] && C.stream.equals(cStream)) return true;
      else return false;
    });

    const atclass = CLASSES.find((c) => c.name === row["Admission Time Class"]);

    const boardingType =
      BOARDINGTYPES.find((bt) => bt.name === row["Boarding Type"]) ||
      naBoarding;

    const subward =
      SUBWARDS.find((sw) => sw.name === row["Sub Ward"]) || naSubward;

    const bus_pick = BUSSES.find((b) => b.name === row["Bus Name"]);
    if (row["Bus Name"] && !bus_pick) {
      errors.push(`bus_pick not found at row: ${i}`);
    }

    const bus_drop = BUSSES.find((b) => b.name === row["Bus Name"]);
    if (row["Bus Name"] && !bus_drop) {
      errors.push(`bus_drop not found at row: ${i}`);
    }

    const busStop = BUSSTOPS.find((bs) => bs.name === row["Bus Stop"]);
    if (row["Bus Stop"] && !busStop) {
      errors.push(`stop not found at row: ${i}`);
    }

    const email = row["Std MailId"];

    if (!isEmailValid(email)) {
      errors.push(`Email is invalid at row: ${i}`);
    }

    const student = {
      admission_no: row["Adm. No."],
      admission_serial: row["Admission Serial No."],
      student_id: row["Student Id"],
      roll_no: row["Roll No."],
      name: row["Student Name"],
      class: class_?._id,
      section: section?._id,
      stream: stream?._id,
      admission_time_class: atclass?._id,
      gender: !row["Gender"] ? "na" : row["Gender"] === "MALE" ? "m" : "f",
      house: row["House"],
      blood_group: row["Blood Group"] == "NONE" ? "na" : row["Blood Group"],
      staff_child: row["Staff Child"],
      doa: row["Adm. Date"],
      student_status: row["Student Status"] === "New" ? "n" : "o",
      student_left: row["Student Left"] === "Yes",
      phone: row["Communication Mobile No"]
        ? row["Communication Mobile No"]
        : "9123123123",
      father_details: {
        name: row["Father's Name"],
        phone: row["Father's MobileNo"],
        designation: row["Father's Designation"],
        office_address: row["Father's Office Address"],
        job_title: row["Father's Job Title"],
        adhaar: row["Father Aadhar"],
      },
      mother_details: {
        name: row["Mother's Name"],
        phone: row["Mother's MobileNo"],
        job_title: row["Mother's Job Title"],
        adhaar: row["Mother Aadhar"],
      },
      dob: row["Date of Birth"],
      age: row["AgeInYear"],
      address: {
        permanent: row["Permanent Address"],
        correspondence: row["Correspondence Address"],
      },
      religion: row["Religion"],
      cast:
        row["Student Category"] === "GENERAL" ? "GEN" : row["Student Category"],
      boarding_type: boardingType?._id,
      sub_ward: subward?._id,
      student_club: row["Student Club"],
      student_work_exp: row["Student WorkEx"],
      language_2nd: row["2nd Language"],
      language_3rd: row["3rd Language"],
      exam_subjects: {
        one: row.exam_sub1,
        two: row.exam_sub2,
        three: row.exam_sub3,
        four: row.exam_sub4,
        five: row.exam_sub5,
        six: row.exam_sub6,
        seven: row.exam_sub7,
        eigth: row.exam_sub8,
        nine: row.exam_sub9,
        ten: row.exam_sub10,
        eleven: row["Exam 6th Subject"],
      },
      ews_applicable: row["EWS Applicable"] === "Yes",
      bank_details: {
        name: row["Bank Name"],
        account_type: row["Account Type"],
        account_holder: row["Account Holder"],
        account_no: row["Account No"],
        ifsc: row["IFSC Code"],
      },
      relation_with_student: row["Relation With Student"],
      class_teacher: row["Class Teacher"],
      bus_pick: bus_pick ? bus_pick._id : undefined,
      bus_drop: bus_drop ? bus_drop._id : undefined,
      bus_stop: busStop ? busStop._id : undefined,
      student_adhaar: row["Std Aadharno"],
      sibling: row["Sibling"] === "Yes",
      single_girl_child: row["Single Girl Child"] === "Yes",
      handicapped: row["Handicapped"] === "Yes",
      email,
      photo: row["Adm. No."]?.replace("/", "") + ".jpg",
      rfid: crypto.randomBytes(10).toString("hex"),
      academic_year: ayear,
      school: school._id,
    };

    students.push(student);

    i++;
  }

  if (errors.length > 0) return errors;

  const results = { total_updated: 0, total_inserted: 0 };

  for (const stuData of students) {
    if (await Student.any({ admission_no: stuData.admission_no })) {
      const update = await Student.updateOne(
        { admission_no: stuData.admission_no },
        { $set: stuData }
      );

      results.total_updated++;
    } else {
      const student = await Student.create(stuData);
      results.total_inserted++;
    }
  }

  return results;
};

const addMultipleStudentsAcharyakulam = async (fileData, school, ayear) => {
  const classes = await Class.find().lean();
  const sections = await Section.find().lean();
  const streams = await Stream.find().lean();
  const boardingTypes = await BoardingType.find().lean();
  const subwards = await SubWard.find().lean();

  const classNA = classes.find((c) => c.name === "NA");
  const sectionNA = sections.find((s) => s.name === "NA");
  const boardingTypeNA = boardingTypes.find((bt) => bt.name === "NA");
  const subwardNA = subwards.find((sw) => sw.name === "NA");

  const students = [];
  const errors = [];

  let i = 2;
  for (const row of fileData) {
    let isError = false;

    const admission_no = String(row["Admission No"]);
    const rfid = row["RFID No"];
    const doaRaw = row["Adm. Date"] || 0;
    const stuName = row["Student Name"];
    const gender = row["Gender"];
    const fName = row["Father Name"];
    const mName = row["Mother Name"];
    const phone = row["Mobile No."]
      ? row["Mobile No."].toString().replace("+91", "").replaceAll(" ", "")
      : "9123123123";
    const stuAdhaar = row["Aadhaar Card No."];
    const dobRaw = row["Date of Birth"] || 0;
    const wardType = row["NEW ADM 2024-25"];
    const religion = row["Religion"];
    const blood = row["Blood Group"];
    const house = row["House"];
    const rollNo = row["Roll No"];
    const emailId = row["Email ID"];
    const addressRaw = row["Address"];
    const admClass = row["Adm. Class"];

    if (!admission_no) errors.push(`Admission No not found at row: ${i}`);

    let class_ = classes.find((c) => c.name === row["Class"]);
    if (!class_) {
      errors.push(`Class not found: ${row["Class"]} at row: ${i}`);
      isError = true;
    }

    let section = sections.find((s) => s.name === row["Sec"]);
    if (!section) {
      errors.push(`Sec not found: ${row["Sec"]} at row: ${i}`);
      isError = true;
    }

    const stream = streams.find((s) => s.name === "NA");

    let atclass = classes.find((c) => c.name === admClass);
    if (!atclass) {
      atclass = classes.find((c) => c.name === "NA");
      isError = true;
    }

    const doa = excelDateToJSDate(doaRaw);
    if (isNaN(doa)) {
      errors.push(`Invalid Adm. Date: ${doaRaw} at row: ${i}`);
      isError = true;
    }

    const dob = excelDateToJSDate(dobRaw);
    if (isNaN(dob)) {
      errors.push(`Invalid Adm. Date: ${dobRaw} at row: ${i}`);
      isError = true;
    }

    let address = addressRaw;

    if (!address.toLowerCase().includes("ranchi")) {
      address = address + ", RANCHI";
    }

    const email = !emailId ? `${admission_no}@email.com` : emailId;

    if (!isEmailValid(email)) {
      errors.push(`Invalid email: ${email} at row: ${i}`);
      isError = true;
    }

    if (isError) continue;

    const student = {
      admission_no: admission_no,
      roll_no: rollNo,
      name: stuName,
      class: class_._id,
      section: section._id,
      stream: stream._id,
      admission_time_class: atclass._id,
      gender: !gender ? "na" : gender === "MALE" ? "m" : "f",
      house,
      blood_group: blood,
      doa,
      student_status: wardType === "NEW ADM 2024-25" ? "n" : "o",
      phone,
      father_details: { name: fName },
      mother_details: { name: mName },
      dob,
      age: new Date().getFullYear() - dob.getFullYear(),
      address: {
        permanent: address,
        correspondence: address,
      },
      religion: religion,
      cast: "NA",
      boarding_type: boardingTypeNA._id,
      sub_ward: subwardNA._id,
      student_adhaar: stuAdhaar,
      sibling: wardType === "SIBLING",
      email,
      photo: admission_no.replace("/", "") + ".jpg",
      academic_year: ayear,
      school: school._id,
    };

    if (rfid) {
      if (rfid === "TC") student.active = false;
      else student.rfid = rfid;
    }

    students.push(student);

    i++;
  }

  if (errors.length) return { total: errors.length, msg: errors };

  let updateCount = 0;
  let insertCount = 0;

  for (const stuData of students) {
    if (await Student.any({ admission_no: stuData.admission_no })) {
      const update = await Student.updateOne(
        { admission_no: stuData.admission_no },
        { $set: stuData }
      );

      updateCount++;
    } else {
      if (!stuData.rfid) stuData.rfid = crypto.randomBytes(10).toString("hex");

      const student = await Student.create(stuData);

      insertCount++;
    }
  }

  return { total: updateCount + insertCount, updateCount, insertCount };
};

const addMultipleStudentsGDGoenka = async (fileData, school, ayear) => {
  const classes = await Class.find().lean();
  const sections = await Section.find().lean();
  const streams = await Stream.find().lean();
  const boardingTypes = await BoardingType.find().lean();
  const subwards = await SubWard.find().lean();

  const naClass = classes.find((ele) => ele.name === "NA");
  const ASection = sections.find((ele) => ele.name === "A");
  const naStream = streams.find((ele) => ele.name === "NA");
  const naBoarding = boardingTypes.find((bt) => bt.name === "NA");
  const naSubward = subwards.find((sw) => sw.name === "NA");

  const students = [];
  const errors = [];

  let i = 2;
  for (const row of fileData) {
    const admission_no = row["Admission No."];
    const className = row["Class"];
    const sectionName = row["SECTION"];
    const stuFName = row["Student F Name(*)"]?.trim();
    const stuMName = row["Student Middle Name"]?.trim();
    const stuLName = row["Student Last Name"]?.trim();
    const stuName = stuMName
      ? `${stuFName} ${stuMName} ${stuLName}`
      : `${stuFName} ${stuLName}`;

    const email = row["Email Id"]
      ? row["Email Id"]
      : admission_no.replace("/", "_") + "@email.com";

    const genderRaw = row["Gender"];
    const mobile = row["Mobile"]
      ? row["Mobile"].toString().replace("+91", "").replaceAll(" ", "")
      : "0123456789";
    const dobRaw = row["Date of Birth(dd-MM-YYYY)"];
    const cast = row["Category"];
    const doaRaw = row["Date of Admission(dd-MM-YYYY)"];
    let address = row["Address"];
    const city = row["City"];
    const state = row["State"];
    const country = row["Country"];
    const pincode = row["Pincode"];
    const stuAdhaar = row["Student Adhaar No"];
    const fatherSalutation = row["Father Salutation"];
    const fatherName = row["Father Name"];
    const fatherPhone = row["Father Ph No."];
    const fatherOfficeName = row["Father Office Name"];
    const fatherOfficeAddress = row["Father Office Address"];
    const fatherAdhaar = row["Father Adhaar Card No"];
    const fatherDesignation = row["Father Profession"];
    const motherSalutation = row["Mother Salutation"];
    const motherName = row["Mother Name"];
    const motherPhone = row["Mother Phone No."];
    const motherAdhaar = row["Mother Adhaar Card No"];
    const motherDesignation = row["Mother Profession"];
    const bloodGroup = row["Blood Group"];
    const religion = row["religion"];

    if (!admission_no) {
      errors.push(`Admission No. not found at row: ${i}`);
    }

    const class_ = classes.find((c) => c.name === className?.toUpperCase());
    // if (!class_) errors.push(`Class: ${className} not found at row: ${i}`);

    const section = sections.find((s) => s.name === sectionName?.toUpperCase());
    // if (!section) errors.push(`Section: ${sectionName} not found at row: ${i}`);

    if (!isEmailValid(email)) {
      errors.push(`Invalid email: ${email} at row: ${i}`);
    }

    const doa = !doaRaw
      ? new Date(0)
      : typeof doaRaw === "number"
      ? new Date(excelDateToJSDate(doaRaw))
      : isNaN(new Date(doaRaw))
      ? new Date(0)
      : new Date(doaRaw);

    if (isNaN(doa)) {
      errors.push(`Date of Admission: ${doaRaw} is invalid at row: ${i}`);
    }

    const dob = !dobRaw
      ? new Date(0)
      : typeof dobRaw === "number"
      ? new Date(excelDateToJSDate(dobRaw))
      : isNaN(new Date(dobRaw))
      ? new Date(0)
      : new Date(dobRaw);

    if (isNaN(dob)) {
      errors.push(`Date of Birth: ${dobRaw} is invalid at row: ${i}`);
    }

    if (address && city && pincode) {
      if (!address.toLowerCase().includes(city.toLowerCase())) {
        address = `${address}, ${city}`;
      }

      if (!address.toLowerCase().includes(pincode)) {
        address = `${address} ${pincode}`;
      }
    }

    let gender = "na";
    if (genderRaw === "MALE") gender = "m";
    else if (genderRaw === "FEMALE") gender = "f";

    const studentStatus = admission_no.includes("2024-25") ? "n" : "o";

    const photoName =
      admission_no.length === 17
        ? parseInt(admission_no.slice(5, 9))
        : parseInt(admission_no.slice(6, 10));

    const student = {
      admission_no,
      name: stuName,
      class: !class_ ? naClass._id : class_._id,
      section: !section ? ASection._id : section._id,
      stream: naStream._id,
      gender,
      blood_group: bloodGroup,
      doa,
      student_status: studentStatus,
      phone: mobile,
      father_details: {
        name: fatherName,
        phone: fatherPhone,
        designation: fatherDesignation,
        office_address: !fatherOfficeAddress
          ? ""
          : fatherOfficeAddress.includes(fatherOfficeName)
          ? fatherOfficeAddress
          : `${fatherOfficeName}, ${fatherOfficeAddress}`,
        job_title: "",
        adhaar: fatherAdhaar,
      },
      mother_details: {
        name: motherName,
        phone: motherPhone,
        job_title: motherDesignation,
        adhaar: motherAdhaar,
      },
      dob,
      age: row.age,
      address: {
        permanent: address,
        correspondence: address,
      },
      religion,
      cast: !cast ? "NA" : cast.toUpperCase() === "GENERAL" ? "GEN" : cast,
      boarding_type: naBoarding._id,
      sub_ward: naSubward._id,
      student_adhaar: stuAdhaar,
      email,
      photo: String(photoName) + ".jpg",
      academic_year: ayear,
      school: school._id,
    };

    if (row["RFID"]) student.rfid = row["RFID"];

    students.push(student);

    i++;
  }

  if (errors.length) {
    return { total: errors.length, msg: errors };
  }

  let updateCount = 0;
  let insertCount = 0;

  // return { total: students.length, msg: students };

  for (const stuData of students) {
    if (await Student.any({ admission_no: stuData.admission_no })) {
      const update = await Student.updateOne(
        { admission_no: stuData.admission_no },
        { $set: stuData }
      );

      updateCount++;
    } else {
      if (!stuData.rfid) stuData.rfid = crypto.randomBytes(10).toString("hex");

      const student = await Student.create(stuData);

      insertCount++;
    }
  }

  return { total: updateCount + insertCount, updateCount, insertCount };
};

const addMultipleStudentsTenderHeart = async (fileData, school, ayear) => {
  const classes = await Class.find().lean();
  const sections = await Section.find().lean();
  const streams = await Stream.find().lean();
  const boardingTypes = await BoardingType.find().lean();
  const subwards = await SubWard.find().lean();

  const naStream = streams.find((ele) => ele.name === "NA");
  const naBoarding = boardingTypes.find((bt) => bt.name === "NA");
  const naSubward = subwards.find((sw) => sw.name === "NA");

  const students = [];
  const errors = [];

  let i = 2;
  for (const row of fileData) {
    const admission_no = String(row["Admission no."]);
    const className = row["Class-Section"].split("-")[0];
    const secName = row["Class-Section"].split("-")[1];
    const stuName = row["Name"].trim().replaceAll("  ", " ");
    const email = admission_no.replace("/", "_") + "@email.com";

    if (!admission_no) {
      errors.push(`Admission No. not found at row: ${i}`);
    }

    const class_ = classes.find((c) => c.name === className?.toUpperCase());
    if (!class_) errors.push(`Class not found: ${className} at row: ${i}`);

    const section = sections.find((s) => s.name === secName?.toUpperCase());
    if (!section) errors.push(`Section not found: ${secName} at row: ${i}`);

    if (!isEmailValid(email)) {
      errors.push(`Invalid email: ${email} at row: ${i}`);
    }

    const student = {
      admission_no,
      name: stuName,
      class: class_?._id,
      section: section?._id,
      stream: naStream._id,
      gender: "na",
      doa: 0,
      student_status: "o",
      phone: "NA",
      dob: 0,
      cast: "NA",
      boarding_type: naBoarding._id,
      sub_ward: naSubward._id,
      email,
      photo: `${admission_no}.jpg`,
      rfid: row["RFID"],
      academic_year: ayear,
      school: school._id,
    };

    students.push(student);

    i++;
  }

  if (errors.length) {
    return { total: errors.length, msg: errors };
  }

  let updateCount = 0;
  let insertCount = 0;

  // return { total: students.length, msg: students };

  for (const stuData of students) {
    if (await Student.any({ admission_no: stuData.admission_no })) {
      const update = await Student.updateOne(
        { admission_no: stuData.admission_no },
        { $set: stuData }
      );

      updateCount++;
    } else {
      if (!stuData.rfid) stuData.rfid = crypto.randomBytes(10).toString("hex");

      const student = await Student.create(stuData);

      insertCount++;
    }
  }

  return { updatedCount, insertCount };
};

const getStudentAddress = (address) => {
  if (!address) return "NA";
  let res = address.house + ", ";
  res += address.street + ", ";
  res += address.city + " " + address.pincode + ", ";
  res += address.pincode;

  return res;
};

const getClassesNSectionsIdsFromNames = async (classSectionNames, ayear) => {
  if (!classSectionNames || !classSectionNames.length) {
    throwCustomValidationErr(C.getFieldIsReq("class_section_names"));
  }

  const classNames = [];
  const sectionNames = [];

  for (const name of classSectionNames) {
    // class-name , section-stream-name
    const [cName, ssName] = name.split("-");

    const splitIdx =
      ssName.indexOf(" ") === -1 ? ssName.length : ssName.indexOf(" ");

    const sectionName = ssName.slice(0, splitIdx);
    const streamName = ssName.slice(splitIdx);

    const classAndStream = `${cName}${streamName}`;
    if (!classNames.includes(classAndStream)) classNames.push(classAndStream);
    if (!sectionNames.includes(sectionName)) sectionNames.push(sectionName);
  }

  const classIds = await validateClassesFromName(classNames, ayear);
  const secIds = await validateSectionsFromName(sectionNames, ayear);

  return [classIds, secIds];
};

const getClassNSectionIdFromName = async (classSectionName, ayear) => {
  if (!classSectionName || !classSectionName.length) {
    throwCustomValidationErr(C.getFieldIsReq("class_section_name"));
  }

  // class-name , section-stream-name
  const [cName, ssName] = classSectionName.split("-");

  const splitIdx =
    ssName.indexOf(" ") === -1 ? ssName.length : ssName.indexOf(" ");

  const sectionName = ssName.slice(0, splitIdx);
  const streamName = ssName.slice(splitIdx);

  const classAndStream = `${cName}${streamName}`;

  const classId = await validateClassByName(classAndStream, ayear);
  const secId = await validateSectionByName(sectionName, ayear);

  return [classId, secId];
};

const getStudentClassTitle = (student) => {
  const className = student.class.name;
  const streamName = student.stream.name;

  return streamName === "NA" ? `${className}` : `${className} (${streamName})`;
};

const getStudentClassSectionTitle = (student) => {
  const className = student.class.name;
  const sectionName = student.section.name;
  const streamName = student.stream.name;

  return streamName === "NA"
    ? `${className} - ${sectionName}`
    : `${className} - ${sectionName} (${streamName})`;
};

// ************************
// STUDENT FUNCTIONS END
// ************************

// ************************
// BUS-STAFF FUNCTIONS START
// ************************

const addMultipleBusStaffs = async (data, school) => {
  const staffs = [];
  const errors = [];

  let i = 1;
  for (const row of data) {
    if (!row.type) errors.push(C.getFieldIsReqAtIdx("type", i));
    if (!row.name) errors.push(C.getFieldIsReqAtIdx("name", i));
    if (!row.doj) errors.push(C.getFieldIsReqAtIdx("doj", i));
    if (!row.phone_primary)
      errors.push(C.getFieldIsReqAtIdx("phone_primary", i));

    if (staffs.find((s) => s.phone.primary === row.phone_primary)) {
      errors.push(`Duplicate Values: phone_primary [${row.phone_primary}]`);
    }

    const doj = excelDateToJSDate(row.doj);

    if (isNaN(doj)) errors.push(C.getFieldIsInvalidAtIdx("doj", i));

    staffs.push({
      type: row.type,
      name: row.name,
      doj,
      email: row.email,
      phone: {
        primary: row.phone_primary,
        secondary: row.phone_secondary,
      },
      driving_license: {
        number: row.dl_number,
        expiry_date: row.dl_expiry_date,
      },
      school: school._id,
    });

    i++;
  }

  if (errors.length > 0) return errors;

  const busStaffs = [];
  for (const staff of staffs) {
    if (await BusStaff.any({ "phone.primary": staff.phone.primary })) {
      const update = await BusStaff.updateOne(
        { "phone.primary": staff.phone.primary },
        {
          $set: {
            type: row.type,
            name: row.name,
            doj: row.doj,
            email: row.email,
            "phone.secondary": staff.phone.secondary,
            driving_license: {
              number: row.dl_number,
              expiry_date: row.dl_expiry_date,
            },
          },
        }
      );

      busStaffs.push({ phone_primary: staff.phone.primary, msg: update });
    } else {
      const busStaff = await BusStaff.create(staff);

      busStaffs.push(busStaff._id);
    }
  }

  return busStaffs;
};

// ************************
// BUS-STAFF FUNCTIONS END
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
    if (!row.monthly_charges && row.monthly_charges !== 0)
      errors.push(C.getFieldIsReqAtIdx("monthly_charges", i));
    if (!row.lat && row.lat !== 0) errors.push(C.getFieldIsReqAtIdx("lat", i));
    if (!row.lon && row.lon !== 0) errors.push(C.getFieldIsReqAtIdx("lon", i));

    row.name = row.name.toUpperCase();

    if (stops.find((s) => s.name === row.name)) {
      errors.push(`Duplicate Values: name [${row.name}]`);
    }

    stops.push({
      name: row.name,
      address: row.address,
      monthly_charges: row.monthly_charges,
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
            monthly_charges: stop.monthly_charges,
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
  const ignition = device.params?.io239 === "1";

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

  const device = await Device.findOne({ imei: bus.temp_device.imei }).lean();

  return device ? device.device : bus.device;
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
    // if (!row.stops) errors.push(C.getFieldIsReqAtIdx("stops", i));
    if (!row.driver) errors.push(C.getFieldIsReqAtIdx("driver", i));
    if (!row.conductor) errors.push(C.getFieldIsReqAtIdx("conductor", i));

    const name = String(row.name)?.toUpperCase();
    const no_plate = String(row.no_plate)?.toUpperCase();
    const model = String(row.model)?.toUpperCase();
    const busStops = row.stops?.split(";") || [];
    const driverName = row.driver?.toUpperCase();
    const conductorName = row.conductor?.toUpperCase();

    if (buses.find((b) => b.name === name)) {
      errors.push(`Duplicate Values: name [${row.name}]`);
    }

    if (buses.find((b) => b.device.imei === row.imei)) {
      errors.push(`Duplicate Values: device [${row.device}]`);
    }

    if (busStops.length === 0) {
      // errors.push(C.getFieldIsReqAtIdx("stops", i));
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
      device: row.imei,
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
    const device = await Device.findOne({ imei: bus.device });
    if (!device) {
      const newDevice = await Device.create({ imei: bus.device, type: C.BUS });
      bus.device = newDevice._id;
    } else bus.device = device._id;

    if (await Bus.any({ name: bus.name })) {
      const update = await Bus.updateOne(
        { name: bus.name },
        {
          $set: {
            no_plate: bus.no_plate,
            model: bus.model,
            device: bus.device,
            stops: bus.stops,
            driver: bus.driver,
            conductor: bus.conductor,
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
// STAFF TIME CALCULATION FUNCTION STARTS
// ************************

const calculateOverTime = (shiftData) => {
  const clockInTime = shiftData.clock_in_time;
  const clockOutTime = shiftData.clock_out_time;

  const [clockInHours, clockInMinutes] = clockInTime.split(":").map(Number);
  const [clockOutHours, clockOutMinutes] = clockOutTime.split(":").map(Number);

  const totalClockInMinutes = clockInHours * 60 + clockInMinutes;
  const totalClockOutMinutes = clockOutHours * 60 + clockOutMinutes;

  const shiftDurationMinutes = totalClockOutMinutes - totalClockInMinutes;
  const standardShiftDuration = (clockOutTime - clockInTime) * 60;

  const overTimeMinutes = shiftDurationMinutes - standardShiftDuration;
  return overTimeMinutes > 0 ? overTimeMinutes : 0;
};

// ************************
// VALIDATION FUNCTIONS START
// ************************

const validateDate = (date, fieldName) => {
  if (!date) throwCustomValidationErr(C.getFieldIsReq(fieldName));

  const date_ = new Date(date);

  if (isNaN(date_)) throwCustomValidationErr(C.getFieldIsInvalid(fieldName));

  return date_;
};

const validateAndSetDate = (date, fieldName) => {
  if (!date) throwCustomValidationErr(C.getFieldIsReq(fieldName));

  const date_ = new Date(date);

  if (isNaN(date_)) throwCustomValidationErr(C.getFieldIsInvalid(fieldName));

  date_.setUTCHours(0, 0, 0, 0);

  return date_;
};

const validateSchool = async (user, school) => {
  if (isSchool(user)) school = user.school._id;

  if (!school) throwCustomValidationErr(C.getFieldIsReq("school"));

  if (!(await School.any({ _id: school }))) {
    throwCustomValidationErr(C.getResourse404Id("school", school));
  }

  return school;
};

const validateFeeTermsFromName = async (feeTerms, academic_year) => {
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

const validateClassesFromName = async (classes, academic_year) => {
  if (!classes || classes.length === 0) {
    throwCustomValidationErr(C.getFieldIsReq("classes"));
  }

  const result = [];

  for (let name of classes) {
    name = name.toUpperCase();
    const idx = name.indexOf(" ");

    const nameArr =
      idx !== -1 ? [name.slice(0, idx), name.slice(idx + 1)] : [name];

    const query = { name: nameArr[0], academic_year };

    // if name contains stream
    if (nameArr[1]) {
      const stream = await Stream.findOne({ name: nameArr[1] })
        .select("_id")
        .lean();

      if (!stream) {
        throwCustomValidationErr(C.getResourse404Id("class", name));
      }

      query.stream = stream._id;
    }

    const c = await Class.findOne(query)
      .select("stream")
      .populate("stream", "name")
      .lean();

    if (!c || (c.stream.name !== "NA" && c.stream.name !== nameArr[1])) {
      throwCustomValidationErr(C.getResourse404Id("classes", name));
    }

    result.push(c._id);
  }

  return result;
};

const validateSectionsFromName = async (sections, academic_year) => {
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

const validateStreamsFromName = async (streams, academic_year) => {
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

const validateBoardingTypesFromName = async (boardingTypes) => {
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

const validateBusesFromName = async (names) => {
  if (!names || names.length === 0) {
    throwCustomValidationErr(C.getFieldIsReq("bus_names"));
  }

  const result = [];

  for (const name of names) {
    const bus = await Bus.findOne({ name: name.toUpperCase() })
      .select("_id")
      .lean();

    if (!bus) {
      throwCustomValidationErr(C.getResourse404Id("bus_names", name));
    }

    result.push(bus._id);
  }

  return result;
};

const validateStudentByAdmissionNo = async (admission_no, academic_year) => {
  if (!admission_no) {
    throwCustomValidationErr(C.getFieldIsReq("admission_no"));
  }

  const student = await Student.findOne({
    admission_no: admission_no.toUpperCase(),
    academic_year,
  })
    .select("_id")
    .lean();

  if (!student)
    throwCustomValidationErr(C.getResourse404Id("admission_no", admission_no));

  return student._id;
};

const validateClassByName = async (name, academic_year) => {
  if (!name) {
    throwCustomValidationErr(C.getFieldIsReq("class_name"));
  }

  name = name.toUpperCase();
  const idx = name.indexOf(" ");
  const nameArr =
    idx !== -1 ? [name.slice(0, idx), name.slice(idx + 1)] : [name];
  const query = { name: nameArr[0], academic_year };

  if (nameArr[1]) {
    const stream = await Stream.findOne({ name: nameArr[1] })
      .select("_id")
      .lean();

    if (!stream) {
      throwCustomValidationErr(C.getResourse404Id("class_name", name));
    }

    query.stream = stream._id;
  }

  const c = await Class.findOne(query)
    .select("stream")
    .populate("stream", "name")
    .lean();

  if (!c || (c.stream.name !== "NA" && c.stream.name !== nameArr[1])) {
    throwCustomValidationErr(C.getResourse404Id("class", name));
  }

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

const validateStreamByName = async (name, academic_year) => {
  if (!name) {
    throwCustomValidationErr(C.getFieldIsReq("stream"));
  }

  const stream = await Stream.findOne({
    name: name.toUpperCase(),
    academic_year,
  })
    .select("_id")
    .lean();

  if (!stream) throwCustomValidationErr(C.getResourse404Id("stream", name));

  return stream._id;
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

const validateLessonByName = async (lessonName, academic_year) => {
  if (!lessonName) {
    throwCustomValidationErr(C.getFieldIsReq("lesson"));
  }

  const lesson = await Lesson.findOne({
    name: lessonName.toUpperCase(),
    academic_year,
  })
    .select("_id")
    .lean();

  if (!lesson)
    throwCustomValidationErr(C.getResourse404Id("lesson", lessonName));

  return lesson._id;
};

const validateStudentById = async (studentId, academic_year) => {
  if (!studentId) {
    throwCustomValidationErr(C.getFieldIsReq("studentId"));
  }

  const student = await Student.findOne({
    _id: studentId,
    academic_year,
  })
    .select("_id")
    .lean();

  if (!student)
    throwCustomValidationErr(C.getResourse404Id("student", studentId));

  return student._id;
};

const validateHomeworkById = async (homeworkId, academic_year) => {
  if (!homeworkId) {
    throwCustomValidationErr(C.getFieldIsReq("homeworkId"));
  }

  const homework = await Homework.findOne({
    _id: homeworkId,
    academic_year,
  })
    .select("_id")
    .lean();

  if (!homework)
    throwCustomValidationErr(C.getResourse404Id("homework", homeworkId));

  return homework._id;
};

const validateBoardingTypeByName = async (name) => {
  if (!name) {
    throwCustomValidationErr(C.getFieldIsReq("boarding_type"));
  }

  const bt = await BoardingType.findOne({ name: name.toUpperCase() })
    .select("_id")
    .lean();

  if (!bt) throwCustomValidationErr(C.getResourse404Id("boarding_type", name));

  return bt._id;
};

const validateSubwardByName = async (name) => {
  if (!name) {
    throwCustomValidationErr(C.getFieldIsReq("subward"));
  }

  const subward = await SubWard.findOne({ name: name.toUpperCase() })
    .select("_id")
    .lean();

  if (!subward) throwCustomValidationErr(C.getResourse404Id("subward", name));

  return subward._id;
};

const validateFeeTermByName = async (name, academic_year) => {
  if (!name) {
    throwCustomValidationErr(C.getFieldIsReq("fee_term"));
  }

  const ft = await FeeTerm.findOne({
    name: name.toUpperCase(),
    academic_year,
  })
    .select("_id")
    .lean();

  if (!ft) throwCustomValidationErr(C.getResourse404Id("fee_term", name));

  return ft._id;
};

const validateFeeTypeByName = async (
  name,
  academic_year,
  field = "fee_type"
) => {
  if (!name) {
    throwCustomValidationErr(C.getFieldIsReq(field));
  }

  const ft = await FeeType.findOne({
    name: name.toUpperCase(),
    academic_year,
  })
    .select("_id")
    .lean();

  if (!ft) throwCustomValidationErr(C.getResourse404Id(field, name));

  return ft._id;
};

const validateBusByName = async (name, field = "bus") => {
  if (!name) {
    throwCustomValidationErr(C.getFieldIsReq(field));
  }

  const bus = await Bus.findOne({ name: name.toUpperCase() })
    .select("_id")
    .lean();

  if (!bus) throwCustomValidationErr(C.getResourse404Id(field, name));

  return bus._id;
};

const validateBusStopByName = async (name, field = "bus_stop") => {
  if (!name) {
    throwCustomValidationErr(C.getFieldIsReq(field));
  }

  const busStop = await BusStop.findOne({ name: name.toUpperCase() })
    .select("_id")
    .lean();

  if (!busStop) throwCustomValidationErr(C.getResourse404Id(field, name));

  return busStop._id;
};

const validateDepartmentByName = async (name) => {
  if (!name) {
    throwCustomValidationErr(C.getFieldIsReq("department"));
  }

  const dept = await Department.findOne({ name: name.toUpperCase() })
    .select("_id")
    .lean();

  if (!dept) throwCustomValidationErr(C.getResourse404Id("department", name));

  return dept._id;
};

const validateDesignationByName = async (title) => {
  if (!title) {
    throwCustomValidationErr(C.getFieldIsReq("designation"));
  }

  const deg = await Designation.findOne({ title: title.toUpperCase() })
    .select("_id")
    .lean();

  if (!deg) throwCustomValidationErr(C.getResourse404Id("designation", title));

  return deg._id;
};

const validateBankByName = async (name) => {
  if (!name) {
    throwCustomValidationErr(C.getFieldIsReq("bank"));
  }

  const bank = await Bank.findOne({ bank_name: name.toUpperCase() })
    .select("_id")
    .lean();

  if (!bank) throwCustomValidationErr(C.getResourse404Id("bank", name));

  return bank._id;
};

const validateChartByName = async (head) => {
  if (!head) {
    throwCustomValidationErr(C.getFieldIsReq("chart"));
  }

  const chart = await Chart.findOne({ head: head.toUpperCase() })
    .select("_id")
    .lean();

  if (!chart) throwCustomValidationErr(C.getResourse404Id("chart", head));

  return chart._id;
};

const throwCustomValidationErr = (msg) => {
  const e = new Error(msg);
  e.name = C.CUSTOMVALIDATION;
  throw e;
};

const validateStaffById = async (staffId) => {
  if (!staffId) {
    throwCustomValidationErr(C.getFieldIsReq("staff"));
  }

  const st = await Staff.findOne({ _id: staffId }).select("_id").lean();

  if (!st) throwCustomValidationErr(C.getResourse404Id("staff", staffId));

  return st._id;
};

const validateShiftByName = async (name, type) => {
  if (!name) {
    throwCustomValidationErr(C.getFieldIsReq("name"));
  }

  if (!type) {
    throwCustomValidationErr(C.getFieldIsReq("type"));
  }

  const sh = await Shift.findOne({
    name: name.toUpperCase(),
    type: type.toUpperCase(),
  })
    .select("_id")
    .lean();

  if (!sh) throwCustomValidationErr(C.getResourse404Id("shift", name));

  return sh._id;
};

const validateUserById = async (userId, academic_year) => {
  if (!userId) {
    throwCustomValidationErr(C.getFieldIsReq("userId"));
  }

  const user = await User.findOne({
    _id: userId,
    academic_year,
  })
    .select("_id")
    .lean();

  if (!user) throwCustomValidationErr(C.getResourse404Id("user", userId));

  return user._id;
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

/**
 * Converts a UTC 0 date to UTC +05:30.
 * Eg: 2024-01-02T03:04:05Z => 2024-01-02T08:34:05Z
 * @param {String|Date} date - valid javascript date string in utc 0 or Date object
 * @returns ISO String of date with +05:30 adjusted
 */
const convUTCTo0530 = (date) => {
  const currDt = new Date(date);

  if (isNaN(currDt)) return "NA";

  const dt = new Date(currDt.toISOString().replace("Z", "-05:30"));

  return dt.toISOString();
};

/**
 * Formats a date string into "DD MMM YYYY HH:MM:SS AM/PM" format.
 * Eg: 2024-01-02T03:04:05Z => 02 Jan 2024 03:04:05 AM
 *
 * @param {string|Date} dateTime - The date and time to format. This can be a date string or a Date object.
 * @returns {string} The formatted date string. Returns "NA" if the date is invalid.
 */
const formatDateTimeToAMPM = (dateTime) => {
  const dt = new Date(dateTime);

  if (dt.getTime() === 0) return "NA";

  const Y = String(dt.getUTCFullYear()).padStart(2, "0");
  // const M = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const M = new Date(dateTime).toLocaleString("default", {
    month: "short",
  });
  const D = String(dt.getUTCDate()).padStart(2, "0");
  const h_ = dt.getUTCHours();
  const h = String(h_ > 12 ? h_ - 12 : h_).padStart(2, "0");
  const m = String(dt.getUTCMinutes()).padStart(2, "0");
  const s = String(dt.getUTCSeconds()).padStart(2, "0");
  const postFix = h_ > 11 ? "PM" : "AM";

  return `${D}-${M}-${Y.slice(2, 4)} ${h}:${m}:${s} ${postFix}`;
};

/**
 * Formats a date string into "DD MMM YYYY HH:MM:SS AM/PM" format.
 * Eg: 2024-01-02T03:04:05Z => 02 Jan 2024
 *
 * @param {string|Date} dateTime - The date and time to format. This can be a date string or a Date object.
 * @returns {string} The formatted date string. Returns "NA" if the date is invalid.
 */
const formatDate = (dateTime) => {
  const dt = new Date(dateTime);

  if (dt.getTime() === 0) return "NA";

  const Y = String(dt.getUTCFullYear()).padStart(2, "0");
  const M = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const D = String(dt.getUTCDate()).padStart(2, "0");

  const monthName = new Date(dateTime).toLocaleString("default", {
    month: "short",
  });

  return `${D} ${monthName} ${Y}`;
};

/**
 * Converts and Formats a date string into "DD MMM YYYY" format.
 * Eg: 2024-01-02T03:04:05Z => 02 Jan 2024 08:34:05 AM
 *
 * @param {string|Date} dateTime - The date and time to format. This can be a date string or a Date object.
 * @returns {string} The formatted date and time string. Returns "NA" if the date is invalid.
 */
const convAndFormatDT = (dateTime) => {
  return formatDateTimeToAMPM(convUTCTo0530(dateTime));
};

/**
 * Converts and Formats a date string into "DD MMM YYYY" format.
 * Eg: 2024-01-02T03:04:05Z => 02 Jan 2024 08:34:05 AM
 *
 * @param {string|Date} dateTime - The date and time to format. This can be a date string or a Date object.
 * @returns {string} The formatted date string. Returns "NA" if the date is invalid.
 */
const convAndFormatDate = (dateTime) => {
  return formatDate(convUTCTo0530(dateTime));
};

/**
 *
 * @param {Integer|String} excelDate - Number of days from 1900-01-01 or a valid Date string
 * @returns adjusted JavaScript Date with Excel's 1900 leap year-bug
 */
const excelDateToJSDate = (excelDate) => {
  if (typeof excelDate === "string") {
    const date = new Date(excelDate);

    return date;
  }

  // Unix epoch starts on 1970-01-01, and Excel epoch starts on 1900-01-01
  const excelEpochStart = new Date(Date.UTC(1900, 0, 1));
  const dateOffset = excelDate - 2; // Adjust for Excel's 1900 leap year bug
  const jsDate = new Date(excelEpochStart.getTime() + dateOffset * 86400000); // Convert days to milliseconds
  return jsDate;
};

const getDatesArrayFromDateRange = (start, end) => {
  const dates = [];

  let dt = new Date(start);

  while (dt < end) {
    dates.push(new Date(dt));
    dt = new Date(dt.setUTCDate(dt.getUTCDate() + 1));
  }

  return dates;
};

const getMonthAndYear = (date = new Date()) => {
  const year = date.getUTCFullYear();

  if (date.getUTCMonth() === 0) return `JAN ${year}`;
  else if (date.getUTCMonth() === 1) return `FEB ${year}`;
  else if (date.getUTCMonth() === 2) return `MAR ${year}`;
  else if (date.getUTCMonth() === 3) return `APR ${year}`;
  else if (date.getUTCMonth() === 4) return `MAY ${year}`;
  else if (date.getUTCMonth() === 5) return `JUN ${year}`;
  else if (date.getUTCMonth() === 6) return `JUL ${year}`;
  else if (date.getUTCMonth() === 7) return `AUG ${year}`;
  else if (date.getUTCMonth() === 8) return `SEP ${year}`;
  else if (date.getUTCMonth() === 9) return `OCT ${year}`;
  else if (date.getUTCMonth() === 10) return `NOV ${year}`;
  else if (date.getUTCMonth() === 11) return `DEC ${year}`;
};

const getDifferenceBetweenHours = (endtime, starttime) => {
  // Parse starttime
  let [startHours, startMinutes] = starttime.split(":").map(Number);

  // Parse endtime
  let [endHours, endMinutes] = endtime.split(":").map(Number);

  // Convert both times to minutes since midnight
  let startTotalMinutes = startHours * 60 + startMinutes;
  let endTotalMinutes = endHours * 60 + endMinutes;

  // Calculate the difference in minutes
  let differenceMinutes;
  if (endTotalMinutes === startTotalMinutes) {
    // Handle case where starttime and endtime are the same
    differenceMinutes = 24 * 60;
  } else if (endTotalMinutes > startTotalMinutes) {
    differenceMinutes = endTotalMinutes - startTotalMinutes;
  } else {
    differenceMinutes = 24 * 60 - startTotalMinutes + endTotalMinutes;
  }

  // Convert difference back to hours and minutes
  let differenceHours = Math.floor(differenceMinutes / 60);
  let remainingMinutes = differenceMinutes % 60;

  // Format the result as HH:MM
  let formattedHours = String(differenceHours).padStart(2, "0");
  let formattedMinutes = String(remainingMinutes).padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}`;
};

const convertHHMMToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  let totalMinutes = hours * 60 + minutes;

  return totalMinutes;
};

const getMonthsBetweenDates = (fromDate, toDate) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (from.getTime() > to.getTime()) return 0;

  const fromYear = from.getFullYear();
  const fromMonth = from.getMonth();
  const toYear = to.getFullYear();
  const toMonth = to.getMonth();

  const yearDifference = toYear - fromYear;
  const monthDifference = toMonth - fromMonth;

  const totalMonths = yearDifference * 12 + monthDifference;

  return totalMonths;
};

// ************************
// DATE FUNCTIONS END
// ************************

// ************************
// MATHS FUNCTIONS START
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

// ************************
// MATHS FUNCTIONS END
// ************************

// ************************
// MISC FUNCTIONS START
// ************************

const getAppRootDir = (currentDir) => {
  while (!fs.existsSync(path.join(currentDir, "package.json"))) {
    currentDir = path.join(currentDir, "..");
  }

  return currentDir;
};

const writeLog = (name, data) => {
  const logDir = path.join(getAppRootDir(__dirname), "logs", name);

  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const logFile = path.join(logDir, `${name}_${getYMD()}.log`);

  let str = `[${new Date().toISOString().replace("T", " ").split(".")[0]}] `;

  str += "=> " + data + "\n";

  try {
    fs.appendFileSync(logFile, str);
  } catch (err) {
    console.log(err);
  }
};

const replaceEmailSymbols = (email) => {
  return email.replace(/[!#$%&'*+/=?^_`{|}~.-]/g, "_");
};

// ************************
// MISC FUNCTIONS END
// ************************

module.exports = {
  createSearchQuery,
  paginatedArrayQuery,
  paginatedQuery,
  paginatedQueryProPlus,
  excelToJson,
  jsonToExcel,
  getRoleId,
  getRolePrivilegeId,

  getBankFromName,

  isSuperAdmin,
  isAdmin,
  isAdmins,
  isSchool,
  isParent,
  isTeacher,
  getUsernameFromEmail,
  schoolAccExists,
  getUserContactInfo,

  getLibraryVariables,
  addMultipleSchools,

  addMultipleStudents,
  addMultipleStudentsDPS,
  addMultipleStudentsAcharyakulam,
  addMultipleStudentsGDGoenka,
  addMultipleStudentsTenderHeart,
  getStudentAddress,
  getClassesNSectionsIdsFromNames,
  getClassNSectionIdFromName,
  getStudentClassTitle,
  getStudentClassSectionTitle,

  addMultipleBusStaffs,

  addMultipleBusStops,

  getBusIcon,
  getBusDevice,
  addMultipleBuses,

  validateDate,
  validateAndSetDate,
  validateSchool,
  validateFeeTermsFromName,
  validateClassesFromName,
  validateClassByName,
  validateSectionsFromName,
  validateStreamsFromName,
  validateBoardingTypesFromName,
  validateBusStops,
  validateBusesFromName,
  validateStudentByAdmissionNo,
  validateSectionByName,
  validateStreamByName,
  validateStaffById,
  validateSubjectByName,
  validateLessonByName,
  validateBoardingTypeByName,
  validateSubwardByName,
  validateFeeTermByName,
  validateFeeTypeByName,
  validateBusByName,
  validateBusStopByName,
  validateDepartmentByName,
  validateDesignationByName,
  validateBankByName,
  validateChartByName,
  validateShiftByName,
  validateStudentById,
  validateHomeworkById,
  validateUserById,
  throwCustomValidationErr,

  getYMD,
  getDDMMYYYY,
  getDDMMYYYYwithTime,
  daysBetween,
  convUTCTo0530,
  formatDateTimeToAMPM,
  formatDate,
  convAndFormatDT,
  convAndFormatDate,
  excelDateToJSDate,
  getDatesArrayFromDateRange,
  getMonthAndYear,
  getDifferenceBetweenHours,
  convertHHMMToMinutes,
  getMonthsBetweenDates,

  getAngle,
  getLenBtwPointsInKm,
  isPointInCircle,
  isPointInPolygon,

  getAppRootDir,
  writeLog,
  replaceEmailSymbols,

  calculateOverTime,
};
