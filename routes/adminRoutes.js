const express = require("express");
const {
  memoryUpload,
  studentPhotoUpload,
  studentBulkImportUpload,
} = require("../middlewares/multerMiddleware");
const AdminPanel = require("../controllers/adminPanelController");
const AdminPanelUtil = require("../controllers/adminPanelUtilController");

const adminPanelRouter = express.Router();

/******************
 * 1. User Routes
 * /api/admin-panel/user
 ******************/
const userRouter = express.Router();

userRouter.route("/").get(AdminPanel.getUsers).post(AdminPanel.createUser);
userRouter.get("/required-data", AdminPanel.requiredDataUser);
userRouter
  .route("/:id")
  .get(AdminPanel.getUser)
  .patch(AdminPanel.updateUser)
  .delete(AdminPanel.deleteUser);

/******************
 * 2. School Routes
 * /api/admin-panel/school
 ******************/
const schoolRouter = express.Router();

schoolRouter.route("/").get(AdminPanel.getSchools).post(AdminPanel.addSchool);
schoolRouter
  .route("/:id")
  .get(AdminPanel.getSchool)
  .patch(AdminPanel.updateSchool)
  .delete(AdminPanel.deleteSchool);

schoolRouter.post(
  "/bulk",
  memoryUpload.single("school-file"),
  AdminPanel.bulkOpsSchool
);

/******************
 * 3. BusStaff Routes
 * /api/admin-panel/bus
 ******************/
const driverRouter = express.Router();

driverRouter.route("/").get(AdminPanel.getBusStaffs).post(AdminPanel.addBusStaff);

driverRouter
  .route("/:id")
  .get(AdminPanel.getBusStaff)
  .patch(AdminPanel.updateBusStaff)
  .delete(AdminPanel.deleteBusStaff);

/******************
 * 3. BusStop Routes
 * /api/admin-panel/bus
 ******************/
const busStopRouter = express.Router();

busStopRouter
  .route("/")
  .get(AdminPanel.getBusStops)
  .post(AdminPanel.addBusStop);

busStopRouter
  .route("/:id")
  .get(AdminPanel.getBusStop)
  .patch(AdminPanel.updateBusStop)
  .delete(AdminPanel.deleteBusStop);

/******************
 * 4. Bus Routes
 * /api/admin-panel/bus
 ******************/
const busRouter = express.Router();

busRouter.route("/").get(AdminPanel.getBuses).post(AdminPanel.addBus);

busRouter
  .route("/:id")
  .get(AdminPanel.getBus)
  .patch(AdminPanel.updateBus)
  .delete(AdminPanel.deleteBus);

busRouter.post("/bulk", memoryUpload.single("bus-file"), AdminPanel.bulkOpsBus);

/******************
 * 3. Class Routes
 * /api/admin-panel/bus
 ******************/
const classRouter = express.Router();

classRouter.route("/").get(AdminPanel.getClasses).post(AdminPanel.addClass);

classRouter
  .route("/:id")
  .get(AdminPanel.getClass)
  .patch(AdminPanel.updateClass)
  .delete(AdminPanel.deleteClass);

/******************
 * 3. Section Routes
 * /api/admin-panel/bus
 ******************/
const sectionRouter = express.Router();

sectionRouter
  .route("/")
  .get(AdminPanel.getSections)
  .post(AdminPanel.addSection);

sectionRouter
  .route("/:id")
  .get(AdminPanel.getSection)
  .patch(AdminPanel.updateSection)
  .delete(AdminPanel.deleteSection);

/******************
 * 5. Student Routes
 * /api/admin-panel/student
 ******************/
const studentRouter = express.Router();

studentRouter
  .route("/")
  .get(AdminPanel.getStudents)
  .post(studentPhotoUpload.single("photo"), AdminPanel.addStudent);

studentRouter
  .route("/:id")
  .get(AdminPanel.getStudent)
  .patch(AdminPanel.updateStudent)
  .delete(AdminPanel.deleteStudent);

studentRouter.post(
  "/bulk",
  studentBulkImportUpload.single("import"),
  AdminPanel.bulkOpsStudent
);

studentRouter
  .route("/pik-loc/:id")
  .post(AdminPanel.addPickupLocation)
  .delete(AdminPanel.removePickupLocation);

const utilRouter = express.Router();
utilRouter.get("/manager-list", AdminPanelUtil.getManagerList);
utilRouter.get("/user-list", AdminPanelUtil.getUserList);
utilRouter.get("/school-list", AdminPanelUtil.getSchoolList);
utilRouter.get("/bus-stop-list", AdminPanelUtil.getBusStopList);
utilRouter.get("/bus-list", AdminPanelUtil.getBusList);

adminPanelRouter.use("/user", userRouter);
adminPanelRouter.use("/school", schoolRouter);
adminPanelRouter.use("/bus-staff", schoolRouter);
adminPanelRouter.use("/bus-stop", busStopRouter);
adminPanelRouter.use("/bus", busRouter);
adminPanelRouter.use("/student", studentRouter);
adminPanelRouter.use("/util", utilRouter);

module.exports = adminPanelRouter;
