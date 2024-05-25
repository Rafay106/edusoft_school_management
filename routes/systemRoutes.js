const express = require("express");
const SC = require("../controllers/systemController");
const { memoryUpload } = require("../middlewares/multerMiddleware");

const systemRouter = express.Router();

// 1. Template Privilege Routes
const templatePrivilegeRouter = express.Router();

templatePrivilegeRouter
  .route("/")
  .get(SC.getTemplatePrivileges)
  .post(SC.createTemplatePrivilege);
templatePrivilegeRouter
  .route("/:id")
  .get(SC.getTemplatePrivilege)
  .patch(SC.updateTemplatePrivilege)
  .delete(SC.deleteTemplatePrivilege);

// 2. User Routes
const userRouter = express.Router();

userRouter.route("/").get(SC.getUsers).post(SC.createUser);
userRouter.get("/privileges", SC.getUserPrivileges);
userRouter.get("/required-data", SC.requiredDataUser);
userRouter.patch("/reset-password", SC.resetPassword);
userRouter.post("/set-current-ayear", SC.setCurrentAcademicYear);
userRouter
  .route("/:id")
  .get(SC.getUser)
  .patch(SC.updateUser)
  .delete(SC.deleteUser);

// 3. School Routes
const schoolRouter = express.Router();

schoolRouter
  .route("/")
  .get(SC.getSchool)
  .post(SC.addSchool)
  .patch(SC.updateSchool)
  .delete(SC.deleteSchool);

systemRouter.use("/template-privilege", templatePrivilegeRouter);
systemRouter.use("/user", userRouter);
systemRouter.use("/school", schoolRouter);

module.exports = systemRouter;
