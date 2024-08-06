const express = require("express");
const uploadPaths = require("../config/uploadPaths");
const LSA = require("../controllers/leaveController");
const {upload} = require("../middlewares/multerMiddleware");
const leaveRouter = express.Router();
                      
// 3 leave student apply router
const leaveStudentApplyRouter = express.Router();
leaveStudentApplyRouter.route("/:id")
                       .get(LSA.getStudentLeaveApply) 
                       .patch(LSA.updateLeaveStudentApply)   
                       .delete(LSA.deleteLeaveStudentApply);             

// 2 staffLeaveApply router 
const leaveStaffApplyRouter = express.Router();
leaveStaffApplyRouter.route("/")
                       .post(upload(uploadPaths.leave_apply).single("file"),LSA.addstaffLeaveApply)
                       .get(LSA.getstaffLeavesApply);

leaveStaffApplyRouter.route("/:id")
                      .get(LSA.getstaffLeaveApply) 
                       .patch(LSA.updateLeavestaffApply)   
                       .delete(LSA.deleteLeaveStaffApply);             

// 3 approveStudentLeave router
const approveStudentLeaveRouter = express.Router();



leaveRouter.use("/apply-student",leaveStudentApplyRouter);
leaveRouter.use("/apply-staff",leaveStaffApplyRouter);
leaveRouter.use("/approve-student",approveStudentLeaveRouter);



module.exports = leaveRouter;