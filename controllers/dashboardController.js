const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Student = require("../models/studentInfo/studentModel");
const StuBusAtt = require("../models/attendance/stuBusAttModel");
const Bus = require("../models/transport/busModel");
const AcademicYear = require("../models/academics/academicYearModel");
const User = require("../models/system/userModel");

// @desc    School Dashbaord
// @route   POST /api/dashboard/school
// @access  Private
const schoolDashboard = asyncHandler(async (req, res) => {
  const busIds = req.body.bus_ids;
  let manager = req.body.manager;
  let school = req.body.school;

  [manager, school] = await UC.validateManagerAndSchool(res, manager, school);

  const ayear = await UC.getCurrentAcademicYear(school);

  // Validate date
  const date = UC.validateAndSetDate(req.body.date, "date");

  const stuQuery = { academic_year: ayear, manager, school };

  if (busIds) {
    for (const _id of busIds) {
      const isBus = await Bus.any({ _id, manager, school });

      if (!isBus) {
        res.status(400);
        throw new Error(C.getResourse404Error("Bus", _id));
      }
    }
    if (busIds.length !== 0) stuQuery.bus = busIds;
  }

  const students = await Student.find(stuQuery)
    .select("admission_no name")
    .lean();

  const attendance = await StuBusAtt.find({ date, student: students }).lean();

  const present = attendance.filter((att) => att.list.length !== 0).length;

  const absent = students.filter((stu) => {
    if (attendance.find((att) => att.student.equals(stu._id))) return false;
    return true;
  }).length;

  const morning_entry = attendance.filter((att) => {
    if (att.list.find((attType) => attType.tag === C.M_ENTRY)) return att;
  }).length;

  const morning_exit = attendance.filter((att) => {
    if (att.list.find((attType) => attType.tag === C.M_EXIT)) return att;
  }).length;

  const afternoon_entry = attendance.filter((att) => {
    if (att.list.find((attType) => attType.tag === C.A_ENTRY)) return att;
  }).length;

  const afternoon_exit = attendance.filter((att) => {
    if (att.list.find((attType) => attType.tag === C.A_EXIT)) return att;
  }).length;

  const missed = attendance.filter((att) => {
    if (
      att.list.find((attType) => [C.M_ENTRY, C.M_EXIT].includes(attType.tag)) &&
      !att.list.find((attType) => attType.tag === C.A_ENTRY)
    )
      return att;
  }).length;

  const results = {
    present,
    absent,
    total: students.length,
    morning_entry,
    morning_exit,
    afternoon_entry,
    afternoon_exit,
    missed,
  };

  res.status(200).json(results);
});

module.exports = { schoolDashboard };
