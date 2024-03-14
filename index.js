require("dotenv").config();

// Connect to db
require("./config/db")();

const express = require("express");
const morgan = require("morgan");
const path = require("node:path");
const cron = require("node-cron");
const asyncHandler = require("express-async-handler");
const { errorHandler } = require("./middlewares/errorMiddleware");
const {
  authenticate,
  parentAuthenticate,
  adminPanelAuthorize,
} = require("./middlewares/authMiddleware");
const { listenDeviceData, listenMobileData } = require("./services/listener");
const { sendPushNotification } = require("./tools/notifyPush");
const User = require("./models/system/userModel");
const C = require("./constants");
const { default: mongoose } = require("mongoose");
const { serviceClearHistory } = require("./services/service");
const { writeLog } = require("./utils/common");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,PUT,POST,PATCH,DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "uploads")));

app.post("/api/listener", listenDeviceData);
// app.post("/api/listener/mobile", listenMobileData);

app.use("/api/system", require("./routes/systemRoutes"));

app.use("/api/login", require("./routes/authRoutes"));

app.use(
  "/api/util",
  authenticate,
  adminPanelAuthorize,
  require("./routes/utilRoutes")
);

app.use(
  "/api/admin-panel",
  authenticate,
  adminPanelAuthorize,
  require("./routes/adminRoutes")
);

app.use(
  "/api/transport",
  authenticate,
  adminPanelAuthorize,
  require("./routes/transportRoutes")
);

app.use(
  "/api/academic",
  authenticate,
  adminPanelAuthorize,
  require("./routes/academicRoutes")
);

app.use("/api/parent", parentAuthenticate, require("./routes/parentRoutes"));

/*************
 * Cron Jobs *
 *************/

// cron.schedule("* * * * * *", () => {
//   console.time("sendPush");
//   sendPushNotification();
//   console.timeEnd("sendPush");
// });

cron.schedule("* * * * * *", async () => {
  try {
    await serviceClearHistory();
  } catch (err) {
    writeLog("errors", `${err.stack}`);
  }
});

/*************
 * Cron Jobs *
 *************/

// test routes
app.use("/api/test", authenticate, require("./routes/testRoutes"));

app.all("*", (req, res) => res.status(404).json({ msg: "Url not found!" }));

app.use(errorHandler);

app.listen(process.env.PORT, () =>
  console.log(`attendance.edusoft.in running on port: ${PORT}`)
);
