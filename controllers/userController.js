const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Student = require("../models/studentInfo/studentModel");
const RolePrivilege = require("../models/system/rolePrivilegeModel");
const PushNotification = require("../models/system/pushNotificationModel");

// @desc    Get self
// @route   GET /api/user
// @access  Private
const getSelf = asyncHandler(async (req, res) => {
  const result = req.user;

  const privileges = await RolePrivilege.findOne({
    role: req.user.role._id,
  }).lean();

  result.privileges = privileges.privileges;

  if (UC.isParent(req.user)) {
    const students = await Student.find({ parent: req.user._id }).lean();

    for (const student of students) {
      student.photo = `${process.env.DOMAIN}/uploads/student/${student.photo}`;
    }

    result.students = students;
  }

  res.status(200).json(result);
});

// @desc    Get push notifications
// @route   POST /api/user/notification/push
// @access  Private
const getPushNotification = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "date";
  const search = req.query.search;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");
  const notyType = req.body.notification_type;

  const query = {
    createdAt: { $gte: dtStart, $lte: dtEnd },
    user: req.user._id,
  };

  if (notyType && notyType !== "total") {
    query.type = notyType;
  }

  if (search) {
    const fields = ["type", "msg"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    PushNotification,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  for (const item of results.result) {
    item.createdAt = UC.convAndFormatDT(item.createdAt);
  }

  res.status(200).json(results);
});

module.exports = {
  getSelf,
  getPushNotification,
};
