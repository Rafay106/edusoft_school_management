const express = require("express");
const SC = require("../controllers/systemController");

const systemRouter = express.Router();

// 1. Role Routes
const roleRouter = express.Router();

roleRouter.route("/").get(SC.getRoles).post(SC.createRole);
roleRouter
  .route("/:id")
  .get(SC.getRole)
  .patch(SC.updateRole)
  .delete(SC.deleteRole);

// 2. Role Privilege Routes
const rolePrivilegeRouter = express.Router();

rolePrivilegeRouter
  .route("/")
  .get(SC.getRolePrivileges)
  .post(SC.createRolePrivilege);
rolePrivilegeRouter.get("/update-from-file", SC.updateRoleFromFile);
rolePrivilegeRouter
  .route("/:id")
  .get(SC.getRolePrivilege)
  .patch(SC.updateRolePrivilege)
  .delete(SC.deleteRolePrivilege);

// 3. User Routes
const userRouter = express.Router();

userRouter.route("/").get(SC.getUsers).post(SC.createUser);
userRouter.get("/required-data", SC.requiredDataUser);
userRouter.post("/set-current-ayear", SC.setCurrentAcademicYear);
userRouter
  .route("/:id")
  .get(SC.getUser)
  .patch(SC.updateUser)
  .delete(SC.deleteUser);

// 4. School Routes
const schoolRouter = express.Router();

schoolRouter
  .route("/")
  .get(SC.getSchool)
  .post(SC.addSchool)
  .patch(SC.updateSchool)
  .delete(SC.deleteSchool);
schoolRouter.post("/update-cash", SC.updateSchoolCash);

// 5. WhatsappCoin Routes
const whatsappCoinRouter = express.Router();

whatsappCoinRouter.post("/add", SC.addWhatsappCoins);
whatsappCoinRouter.post("/transaction", SC.getWhatsappCoinTransactions);

// 6. Device Routes
const deviceRouter = express.Router();

deviceRouter.route("/").get(SC.getDevices).post(SC.addDevice);
deviceRouter
  .route("/:id")
  .get(SC.getDevice)
  .patch(SC.updateDevice)
  .delete(SC.deleteDevice);

systemRouter.use("/role", roleRouter);
systemRouter.use("/role-privilege", rolePrivilegeRouter);
systemRouter.use("/user", userRouter);
systemRouter.use("/school", schoolRouter);
systemRouter.use("/whatsapp-coin", whatsappCoinRouter);
systemRouter.use("/device", deviceRouter);

module.exports = systemRouter;
