const express = require("express");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const LeaveStudentApply = require("../models/leave/leaveStudentApplyModel");
const LeaveStaffApply = require("../models/leave/leaveStaffApplyModel");
const LeaveStudentApprove = require("../models/leave/approveLeaveStudentRequestModel");
const Staff = require("../models/hr/staffModel");

// 1 leaves applied by student

// @desc    Get leavesStudentApply
// @route   GET /api/leave/apply-student
// @access  Private

const getStudentLeavesApply = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "l_from";
  const search = req.query.search;
  const query = {};
  if (search) {
    const fields = ["name"];
    const searchQuery = await UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }
  const results = await UC.paginatedQuery({
    LeaveStudentApply,
    query,
    page,
    limit,
    sort,
  });
  if (!results) res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  res.status(200).json(results);
});

// @desc    Get leavesStudentApply
// @route   GET /api/leave/apply-student/:id
// @access  Private

const getStudentLeaveApply = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  const studentLeaveApply = await LeaveStudentApply.findOne(query);
  if (!studentLeaveApply) {
    res.status(404);
    throw new Error(C.getResourse404Id("getStudentLeaveApply", req.params.id));
  }
  res.status(200).json(studentLeaveApply);
});

// @desc    Add a studentLeave
// @route   POST /api/leave/apply-student
// @access  Private

const addStudentLeaveApply = asyncHandler(async (req, res) => {
  if (!req.body.role) {
    res.status(400);
    throw new Error(C.getFieldIsReq(""));
  }
  const role = await Staff.find({ name: req.body.role.toUppercase() })
    .select("_id")
    .lean();
  if (!role) {
    res.status(400);
    throw new Error(C.getResourse404Id("role", req.body.role));
  }
  if (!req.body.teacher) {
    res.status(400);
    throw new Error(C.getFieldIsReq("teacher"));
  }
  const t = await Staff.find({ name: req.body.teacher.toUppercase() })
    .select("_id")
    .lean();
  if (!t) {
    res.status(400);
    throw new Error(C.getResourse404Id("teacher", req.body.teacher));
  }
  const file = req.file ? req.file.filename : " ";
  const leave_stud = await LeaveStudentApply.create({
    role: role._id,
    type: req.body.type,
    teacher: t._id,
    l_from: req.body.l_from,
    l_to: req.body.l_to,
    reason: req.body.reason,
    file,
    academic_year: req.ayear,
    school: req.school,
  });
  res.status(200).json({ msg: leave_stud._id });
});
// @desc    update  leavesStudentApply
// @route   PATCH   api/leave/apply-student/:id
// @access  Private
const updateLeaveStudentApply = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await LeaveStudentApply.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("LeaveStudentApply", req.params.id));
  }

  const updatedLeaveStudentApply = await LeaveStudentApply.updateOne(query, {
    $set: {
      type: req.body.type,
      teacher: req.body.teacher,
      l_from: req.body.l_from,
      l_to: req.body.l_to,
      reason: req.body.reason,
      file: req.body.file,
    },
  });

  res.status(200).json(updatedLeaveStudentApply);
});

// @desc    delete a leavesStudentApply
// @route   DELETE api/leave/apply-student/:id
// @access  Private
const deleteLeaveStudentApply = asyncHandler(async (req, res) => {
  const leaveStudentApply = await LeaveStudentApply.findById(req.params.id)
    .select("_id")
    .lean();
  if (!leaveStudentApply) {
    res.status(400);
    throw new Error(C.getResourse404Id("leaveStudentApply", req.params.id));
  }
  const delQuery = { _id: req.params.id };
  const result = await LeaveStudentApply.deleteOne(delQuery);

  res.status(200).json(result);
});

// 2 leaves applied by staff

// @desc    Get leavesstaffApply
// @route   GET /api/leave/apply-staff
// @access  Private

const getstaffLeavesApply = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "l_from";
  const search = req.query.search;
  const query = {};
  if (search) {
    const fields = ["name"];
    const searchQuery = await UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }
  const results = await UC.paginatedQuery({
    LeaveStaffApply,
    query,
    page,
    limit,
    sort,
  });
  if (!results) res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  res.status(200).json(results);
});

// @desc    Get leavesstaffApply
// @route   GET /api/leave/apply-staff/:id
// @access  Private

const getstaffLeaveApply = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  const staffLeaveApply = await LeaveStaffApply.findOne(query);
  if (!staffLeaveApply) {
    res.status(404);
    throw new Error(C.getResourse404Id("getstaffLeaveApply", req.params.id));
  }
  res.status(200).json(staffLeaveApply);
});

// @desc    Add a staffLeave
// @route   POST /api/leave/apply-staff
// @access  Private

const addstaffLeaveApply = asyncHandler(async (req, res) => {
  if (!req.body.teacher) {
    res.status(400);
    throw new Error(C.getFieldIsReq("teacher"));
  }
  const t = await Staff.find({ name: req.body.teacher.toUppercase() })
    .select("_id")
    .lean();
  if (!t) {
    res.status(400);
    throw new Error(C.getResourse404Id("teacher", req.body.teacher));
  }
  const file = req.file ? req.file.filename : " ";
  const leave_stud = await LeaveStaffApply.create({
    type: req.body.type,
    teacher: t._id,
    l_from: req.body.l_from,
    l_to: req.body.l_to,
    reason: req.body.reason,
    file,
    academic_year: req.ayear,
    school: req.school,
  });
  res.status(200).json({ msg: leave_stud._id });
});
// @desc    update  leavesstaffApply
// @route   PATCH   api/leave/apply-staff/:id
// @access  Private
const updateLeavestaffApply = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await LeavestaffApply.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("LeavestaffApply", req.params.id));
  }

  const updatedLeavestaffApply = await LeaveStaffApply.updateOne(query, {
    $set: {
      type: req.body.type,
      teacher: req.body.teacher,
      l_from: req.body.l_from,
      l_to: req.body.l_to,
      reason: req.body.reason,
      file: req.body.file,
    },
  });

  res.status(200).json(updatedLeavestaffApply);
});

// @desc    delete a leavesstaffApply
// @route   DELETE api/leave/apply-staff/:id
// @access  Private
const deleteLeaveStaffApply = asyncHandler(async (req, res) => {
  const leavestaffApply = await LeaveStaffApply.findById(req.params.id)
    .select("_id")
    .lean();
  if (!leavestaffApply) {
    res.status(400);
    throw new Error(C.getResourse404Id("leavestaffApply", req.params.id));
  }
  const delQuery = { _id: req.params.id };
  const result = await LeavestaffApply.deleteOne(delQuery);

  res.status(200).json(result);
});

// @desc    Add approve leave request for student
// @route   POST /api/leave/approveLeave-student
// @access  Private

const addLeaveStudentApprove = asyncHandler(async (req, res) => {
  if (!req.body.leave_apply) {
    res.status(400);
    throw new Error(C.getFieldIsReq("leave_apply"));
  }
  const lsa = await LeaveStudentApply.find({ _id: req.body.leave_apply });

  if (!lsa) {
    res.status(400);
    throw new Error(
      C.getResourse404Id("leaveStudentApply", req.body.leave_apply)
    );
  }

  const leave_stud_approve = await LeaveStudentApply.create({
    name: req.body.name,
    leave_apply: req.body.leave_apply,
    status: req.body.status,
  });
  res.status(200).json({ msg: leave_stud_approve._id });
});
// @desc    Get leaves approve for students
// @route   GET /api/leave/approve-student
// @access  Private

const getStudentLeavesApprove = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "l_from";
  const search = req.query.search;
  const query = {};
  if (search) {
    const fields = ["name"];
    const searchQuery = await UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }
  const results = await UC.paginatedQuery({
    LeaveStudentApply,
    query,
    page,
    limit,
    sort,
  });
  if (!results) res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  res.status(200).json(results);
});

// @desc    Get leave approve for student
// @route   GET /api/leave/approve-student/:id
// @access  Private
const getStudentLeaveApprove = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  const studentLeaveApply = await LeaveStudentApprove.findOne(query);
  if (!studentLeaveApply) {
    res.status(404);
    throw new Error(C.getResourse404Id("studentLeaveApprove", req.params.id));
  }
  res.status(200).json(studentLeaveApply);
});

// @desc    update  leave by student
// @route   PATCH   api/leave/approve-student/:id
// @access  Private
const updateLeaveStudentApprove = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await LeaveStudentApprove.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("LeaveStudentApprove", req.params.id));
  }

  const updatedLeaveStudentApprove = await LeaveStudentApprove.updateOne(
    query,
    {
      $set: {
        name: req.body.name,
        leave_apply: req.body.leave_apply,
        status: req.body.status,
      },
    }
  );

  res.status(200).json(updatedLeaveStudentApprove);
});

// @desc    delete a leavesStudentApprove
// @route   DELETE api/leave/approve-student/:id
// @access  Private
const deleteLeaveStudentApprove = asyncHandler(async (req, res) => {
  const leaveStudentApprove = await LeaveStudentApprove.findById(req.params.id)
    .select("_id")
    .lean();
  if (!leaveStudentApprove) {
    res.status(400);
    throw new Error(C.getResourse404Id("leaveStudentApprove", req.params.id));
  }
  const delQuery = { _id: req.params.id };
  const result = await LeaveStudentApprove.deleteOne(delQuery);

  res.status(200).json(result);
});

module.exports = {
  getStudentLeavesApply,
  getStudentLeaveApply,
  addStudentLeaveApply,
  updateLeaveStudentApply,
  deleteLeaveStudentApply,

  getstaffLeavesApply,
  getstaffLeaveApply,
  addstaffLeaveApply,
  updateLeavestaffApply,
  deleteLeaveStaffApply,

  addLeaveStudentApprove,
  getStudentLeavesApprove,
  getStudentLeaveApprove,
  updateLeaveStudentApprove,
  deleteLeaveStudentApprove,
};
