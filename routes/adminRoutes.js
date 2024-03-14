const express = require("express");
const {
  memoryUpload,
  studentPhotoUpload,
  studentBulkImportUpload,
  busStaffPhotoUpload,
} = require("../middlewares/multerMiddleware");
const AdminPanel = require("../controllers/adminPanelController");

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

adminPanelRouter.use("/user", userRouter);
adminPanelRouter.use("/school", schoolRouter);

module.exports = adminPanelRouter;
