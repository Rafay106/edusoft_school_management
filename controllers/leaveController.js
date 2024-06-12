const express = require('express');
const asyncHandler = require('express-async-handler');
const C = require("../constants");
const UC = require("../utils/common");
const LeaveStudentApply = require("../models/leave/leaveStudentApplyModel");
const LeaveStaffApply = require("../models/leave/leaveStaffApplyModel");

// @desc    Add a studentLeave
// @route   POST /api/leave/apply-student
// @access  Private

const addStudentLeaveApply = asyncHandler(async(req,res)=>{

    const leave_stud = await LeaveStudentApply.create({
    type:{type:String,required,enum:["c","F","E"]}, // "casual","formal","emergency"
      teacher:{type:ObjectId,required,ref:"hr_staffs"},
      l_from:{type:Date,required},
      l_to:{type:Date,required},
      reason:{type:String,required},
      file:{type:String,default:""},

    })
})


