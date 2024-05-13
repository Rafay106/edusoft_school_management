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

  [manager, school] = await UC.validateManagerAndSchool(
    req.user,
    manager,
    school
  );

  const ayear = UC.getCurrentAcademicYear(school);

  // Validate date
  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");

  const noOfDays = UC.daysBetween(dtStart, dtEnd);

  const stuQuery = { academic_year: ayear, manager, school };

  if (busIds) {
    for (const _id of busIds) {
      const isBus = await Bus.any({ _id, manager, school });

      if (!isBus) {
        res.status(400);
        throw new Error(C.getResourse404Id("Bus", _id));
      }
    }
    if (busIds.length !== 0) stuQuery.bus = busIds;
  }

  const students = await Student.find(stuQuery)
    .select("admission_no name")
    .lean();

  const attendance = await StuBusAtt.find({
    date: { $gte: dtStart, $lte: dtEnd },
    student: students,
  }).lean();

  const total = students.length * noOfDays;

  const present = attendance.filter((att) => att.list.length !== 0).length;

  const absent = total - present;

  const morning_entry = attendance.filter((att) =>
    att.list.find((attType) => attType.tag === C.M_ENTRY)
  ).length;

  const morning_exit = attendance.filter((att) =>
    att.list.find((attType) => attType.tag === C.M_EXIT)
  ).length;

  const afternoon_entry = attendance.filter((att) =>
    att.list.find((attType) => attType.tag === C.A_ENTRY)
  ).length;

  const afternoon_exit = attendance.filter((att) =>
    att.list.find((attType) => attType.tag === C.A_EXIT)
  ).length;

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
    total,
    noOfDays,
    morning_entry,
    morning_exit,
    afternoon_entry,
    afternoon_exit,
    missed,
  };

  res.status(200).json(results);
});

module.exports = { schoolDashboard };
