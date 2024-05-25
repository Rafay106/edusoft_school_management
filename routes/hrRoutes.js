const express = require("express");
const C = require("../controllers/hrController");
const { staffUpload } = require("../middlewares/multerMiddleware");

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
    staffUpload.fields([
      { name: "photo", maxCount: 1 },
      { name: "sign", maxCount: 1 },
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

hrRouter.use("/designation", designationRouter);
hrRouter.use("/department", departmentRouter);
hrRouter.use("/staff", staffRouter);
hrRouter.use("/attendance", AttendanceRouter);

module.exports = hrRouter;
