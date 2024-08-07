const express = require("express");
const C = require("../controllers/hrController");
const { upload } = require("../middlewares/multerMiddleware");
const uploadPaths = require("../config/uploadPaths");

const hrRouter = express.Router();

// 1. Designation Routes
const designationRouter = express.Router();

designationRouter.route("/").get(C.getDesignations).post(C.addDesignation);

designationRouter
  .route("/:id")
  .get(C.getDesignation)
  .patch(C.updateDesignation)
  .delete(C.deleteDesignation);

// 2. Department Routes
const departmentRouter = express.Router();

departmentRouter.route("/").get(C.getDepartments).post(C.addDepartment);

departmentRouter
  .route("/:id")
  .get(C.getDepartment)
  .patch(C.updateDepartment)
  .delete(C.deleteDepartment);

// 3. Staff Routes
const staffRouter = express.Router();

staffRouter
  .route("/")
  .get(C.getStaffs)
  .post(
    upload(uploadPaths.staff).fields([
      { name: "photo", maxCount: 1 },

      { name: "driving", maxCount: 1 },
      {name:"resume",maxCount:1},
      {name:"joining",maxCount:1},
      {name:"other",maxCount:1},

    ]),
    C.addStaff
  );

staffRouter
  .route("/:id")
  .get(C.getStaff)
  .patch(C.updateStaff)
  .delete(C.deleteStaff);

// 4. Attendance routes
const AttendanceRouter = express.Router();
AttendanceRouter.route("/").post();


// 5.  shift routes
const shiftRouter = express.Router();

shiftRouter.route("/").post(C.addShift).get(C.getShifts);
shiftRouter.route("/:id").get(C.getShift).patch(C.updateShift).delete(C.deleteShift);

// 6. shift plan routes
const shiftRuleRouter = express.Router();

shiftRuleRouter.route("/").post(C.addShiftRule).get(C.getShiftsRules);
shiftRuleRouter.route("/:id").get(C.getShiftRule).patch(C.updateShiftRule).delete(C.deleteShiftRule);

//7 shiftPlan routes 
// const shiftPlanRouter = express.Router();
// shiftPlanRouter.route("/").post(C.addShiftPlan).get(C.getShiftPlans);
// shiftPlanRouter.route("/:id").get(C.getShiftPlan).patch(C.updateShiftRule).delete(C.deleteShiftRule);


hrRouter.use("/designation", designationRouter);
hrRouter.use("/department", departmentRouter);
hrRouter.use("/staff", staffRouter);
hrRouter.use("/attendance", AttendanceRouter);
hrRouter.use("/shift",shiftRouter);
hrRouter.use("/shift-rule",shiftRuleRouter);
// hrRouter.use("/shift-plan",shiftPlanRouter);

module.exports = hrRouter;
