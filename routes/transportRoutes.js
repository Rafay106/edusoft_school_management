const express = require("express");
const {
  memoryUpload,
  busStaffPhotoUpload,
} = require("../middlewares/multerMiddleware");
const TC = require("../controllers/transportController");

const transportRouter = express.Router();

// 1. BusStaff Routes
const busStaffRouter = express.Router();

busStaffRouter
  .route("/")
  .get(TC.getBusStaffs)
  .post(busStaffPhotoUpload.single("photo"), TC.addBusStaff);

busStaffRouter
  .route("/:id")
  .get(TC.getBusStaff)
  .patch(busStaffPhotoUpload.single("photo"), TC.updateBusStaff)
  .delete(TC.deleteBusStaff);

// 2. BusStop Routes
const busStopRouter = express.Router();

busStopRouter.route("/").get(TC.getBusStops).post(TC.addBusStop);

busStopRouter
  .route("/:id")
  .get(TC.getBusStop)
  .patch(TC.updateBusStop)
  .delete(TC.deleteBusStop);

// 3. Bus Routes
const busRouter = express.Router();

busRouter.route("/").get(TC.getBuses).post(TC.addBus);
busRouter.post("/track", TC.trackBus);
busRouter.post("/status", TC.getBusStatus);
busRouter.post("/set-alternate", TC.setAlternateBus);
busRouter.post("/unset-alternate", TC.unsetAlternateBus);
busRouter.post("/switch", TC.switchBus);
busRouter.route("/:id").get(TC.getBus).patch(TC.updateBus).delete(TC.deleteBus);
busRouter.post("/bulk", memoryUpload.single("bus-file"), TC.bulkOpsBus);

transportRouter.use("/bus-staff", busStaffRouter);
transportRouter.use("/bus-stop", busStopRouter);
transportRouter.use("/bus", busRouter);

module.exports = transportRouter;
