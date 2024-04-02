require("dotenv").config();

// Connect to db
require("./config/db")();

const express = require("express");
const morgan = require("morgan");
const path = require("node:path");
const cron = require("node-cron");
const { errorHandler } = require("./middlewares/errorMiddleware");
const {
  authenticate,
  parentAuthenticate,
  adminPanelAuthorize,
  parentAuthorize,
  adminAuthorize,
  adminAndManagerAuthorize,
} = require("./middlewares/authMiddleware");
const { listenDeviceData } = require("./services/listener");
const {
  serviceClearHistory,
  serviceResetAlternateBus,
} = require("./services/service");
const { writeLog } = require("./utils/common");
const { sendNotifications } = require("./tools/notifications");

const app = express();
const PORT = process.env.PORT || 8000;

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

app.post("/api/init", require("./controllers/systemController").init);

app.use(
  "/api/system",
  authenticate,
  adminAuthorize,
  require("./routes/systemRoutes")
);
app.use("/api/login", require("./routes/authRoutes"));
app.use(
  "/api/util",
  authenticate,
  adminAndManagerAuthorize,
  require("./routes/utilRoutes")
);
app.use(
  "/api/academics",
  authenticate,
  adminAndManagerAuthorize,
  require("./routes/academicRoutes")
);
app.use(
  "/api/student-info",
  authenticate,
  adminAndManagerAuthorize,
  require("./routes/studentInfoRoutes")
);
app.use(
  "/api/transport",
  authenticate,
  adminAndManagerAuthorize,
  require("./routes/transportRoutes")
);
app.use(
  "/api/hr",
  authenticate,
  adminAndManagerAuthorize,
  require("./routes/hrRoutes")
);
app.use(
  "/api/fee",
  authenticate,
  adminAndManagerAuthorize,
  require("./routes/feeRoutes")
);
app.use(
  "/api/dashboard",
  authenticate,
  adminAndManagerAuthorize,
  require("./routes/dashboardRoutes")
);

app.use(
  "/api/parent",
  authenticate,
  parentAuthorize,
  require("./routes/parentRoutes")
);

app.post("/api/listener", listenDeviceData);
// app.post("/api/listener/mobile", listenMobileData);

// Razorpay
app.use("/api/razorpay", require("./tools/razorpay"));

/*************
 * Cron Jobs *
 *************/

// cron.schedule("* * * * * *", () => {
//   console.time("sendPush");
//   sendNotifications();
//   console.timeEnd("sendPush");
// });

cron.schedule("0 0 * * *", async () => {
  try {
    await serviceClearHistory();
    await serviceResetAlternateBus();
  } catch (err) {
    writeLog("errors", `${err.stack}`);
  }
});

/*************
 * Cron Jobs *
 *************/

// test routes
app.use("/api/test", authenticate, require("./routes/testRoutes"));

// app.use(express.static(path.join(__dirname, "dist")));

// app.get("*", (req, res) =>
//   res.sendFile(path.resolve(__dirname, "dist", "index.html"))
// );

app.all("*", (req, res) => res.status(404).json({ msg: "Url not found!" }));

app.use(errorHandler);

app.listen(process.env.PORT, () =>
  console.log(`Edusoft running on port: ${PORT}`)
);
