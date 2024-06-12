const express = require("express");
const leaveRouter = express.Router();


// 1 studentLeaveApply router
const leaveStudentApplyRouter = express.Router();
leaveStudentApplyRouter.route("/");
                       





leaveRouter.use("/apply-student",leaveStudentApplyRouter);

module.exports = leaveRouter;