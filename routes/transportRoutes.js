const path = require("node:path");
const express = require("express");
const {
  bulkImportUpload,
  photoUpload,
  uploadExcel,
} = require("../middlewares/multerMiddleware");
const TC = require("../controllers/transportController");
const uploadPaths = require("../config/uploadPaths");

const transportRouter = express.Router();

// 1. BusStaff Routes
const busStaffRouter = express.Router();

busStaffRouter
  .route("/")
  .get(TC.getBusStaffs)
  .post(photoUpload(uploadPaths.bus_staff).single("photo"), TC.addBusStaff);
busStaffRouter.post(
  "/bulk",
  uploadExcel(uploadPaths.bulk_import).single("file"),
  TC.bulkOpsBusStaff
);
busStaffRouter
  .route("/:id")
  .get(TC.getBusStaff)
  .patch(photoUpload(uploadPaths.bus_staff).single("photo"), TC.updateBusStaff)
  .delete(TC.deleteBusStaff);

// 2. BusStop Routes
const busStopRouter = express.Router();

busStopRouter.route("/").get(TC.getBusStops).post(TC.addBusStop);
busStopRouter.post(
  "/bulk",
  uploadExcel(uploadPaths.bulk_import).single("file"),
  TC.bulkOpsBusStop
);
busStopRouter
  .route("/:id")
  .get(TC.getBusStop)
  .patch(TC.updateBusStop)
  .delete(TC.deleteBusStop);

// 3. Bus Routes
const busRouter = express.Router();

busRouter.route("/").get(TC.getBuses).post(TC.addBus);
busRouter.post(
  "/bulk",
  uploadExcel(uploadPaths.bulk_import).single("file"),
  TC.bulkOpsBus
);
busRouter.post("/track", TC.trackBus);
busRouter.post("/status", TC.getBusStatus);
busRouter.post("/set-alternate", TC.setAlternateBus);
busRouter.post("/unset-alternate", TC.unsetAlternateBus);
busRouter.post("/switch", TC.switchBus);
busRouter.get("/reset", TC.resetAllBus);
busRouter.route("/:id").get(TC.getBus).patch(TC.updateBus).delete(TC.deleteBus);

// 4. BusAssignment Routes
const busAssignRouter = express.Router();

busAssignRouter.route("/").get(TC.getBusAssigns);
busAssignRouter.post("/assign-to-student", TC.assignBusToStudent);
busAssignRouter.post(
  "/assign-to-student/bulk",
  uploadExcel(uploadPaths.bulk_import).single("file"),
  TC.bulkAssignBus
);
busAssignRouter.post("/unassign-to-student", TC.unassignBusToStudent);
busAssignRouter.post(
  "/unassign-to-student/bulk",
  uploadExcel(uploadPaths.bulk_import).single("file"),
  TC.bulkUnassignBus
);
busAssignRouter.route("/:id").get(TC.getBusAssign);

// 5. Report Routes
const reportRouter = express.Router();

reportRouter.get("/bus-assign", TC.reportBusAssign);
reportRouter.get("/bus-unassign", TC.reportBusUnassign);

// END

transportRouter.use("/bus-staff", busStaffRouter);
transportRouter.use("/bus-stop", busStopRouter);
transportRouter.use("/bus", busRouter);
transportRouter.use("/bus-assign", busAssignRouter);
transportRouter.use("/reports", reportRouter);

transportRouter.post(
  "/import-transport-details",
  uploadExcel(uploadPaths.bulk_import).single("file"),
  TC.importStudentTransportDetails
);

module.exports = transportRouter;
