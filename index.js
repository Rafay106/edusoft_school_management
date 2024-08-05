require("dotenv").config();

// Connect to db
require("./config/db")();

const express = require("express");
const morgan = require("morgan");
const fs = require("node:fs");
const path = require("node:path");
const cron = require("node-cron");
const cors = require("cors");
const { errorHandler } = require("./middlewares/errorMiddleware");
const {
  authenticate,
  authorize,
  authenticateApikey,
} = require("./middlewares/authMiddleware");
const UM = require("./middlewares/utilMiddleware");
const { listenDeviceData } = require("./services/listener");
const SERVICE = require("./services/service");
const UC = require("./utils/common");
const WORKER = require("./tools/bullmq/workers");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors("*"));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));

const logPath = path.join(__dirname, "logs");
if (!fs.existsSync(logPath)) fs.mkdirSync(logPath, { recursive: true });

const accessLogStream = fs.createWriteStream(
  path.join(logPath, `access_${UC.getYMD()}.log`),
  { flags: "a" }
);

app.use(morgan("combined", { stream: accessLogStream }));
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "static")));
app.use(express.static(path.join(__dirname, "data")));

// Routes Start
app.get("/api/schools-list", (req, res) => {
  const filePath = path.join("schools.json");

  if (!fs.existsSync(filePath)) {
    res.status(500);
    throw new Error("schools.json file not found!");
  }

  const schools = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  res.status(200).json(schools);
});

app.post("/api/init", require("./controllers/systemController").init);
app.get("/api/backup-db", require("./controllers/systemController").backupDB);
app.delete(
  "/api/delete-empty-collections",
  require("./controllers/systemController").deleteEmptyCollections
);

app.use(
  "/api/system",
  authenticate,
  authorize,
  require("./routes/systemRoutes")
);
app.use("/api/login", require("./routes/authRoutes"));
app.use("/api/user", authenticate, authorize, require("./routes/userRoutes"));
app.use("/api/util", authenticate, authorize, require("./routes/utilRoutes"));
app.use(
  "/api/admin-section",
  authenticate,
  authorize,
  require("./routes/adminSectionRoutes")
);
app.use(
  "/api/academics",
  authenticate,
  authorize,
  require("./routes/academicRoutes")
);
app.use(
  "/api/student-info",
  authenticate,
  authorize,
  require("./routes/studentInfoRoutes")
);
app.use(
  "/api/transport",
  authenticate,
  authorize,
  require("./routes/transportRoutes")
);
app.use("/api/hr", authenticate, authorize, require("./routes/hrRoutes"));
app.use("/api/fee", authenticate, authorize, require("./routes/feeRoutes"));
app.use(
  "/api/fee-direct/calculate",
  require("./controllers/feeController").feeDirectCalculate
);
app.use(
  "/api/fee-direct/pay",
  require("./controllers/feeController").feeDirectPayment
);
app.use(
  "/api/dashboard",
  authenticate,
  authorize,
  require("./routes/dashboardRoutes")
);
app.use(
  "/api/library",
  authenticate,
  authorize,
  require("./routes/libraryRoutes")
);
app.use(
  "/api/lesson-schedule",
  authenticate,
  authorize,
  require("./routes/lessonRoutes")
);
app.use("/api/comms", authenticate, authorize, require("./routes/commsRoutes"));
app.use(
  "/api/library",
  authenticate,
  authorize,
  require("./routes/libraryRoutes")
);
app.use(
  "/api/tuition",
  authenticate,
  authorize,
  require("./routes/tutionRoutes")
);
app.use(
  "/api/examination",
  authenticate,
  authorize,
  require("./routes/examinationRoutes")
);

app.use(
  "/api/parent-util",
  authenticate,
  authorize,
  require("./routes/parentUtilRoutes")
);
app.use(
  "/api/parent",
  authenticate,
  authorize,
  require("./routes/parentRoutes")
);
app.use("/api/leave", authenticate, authorize, require("./routes/leaveRoutes"));
app.use(
  "/api/account",
  authenticate,
  authorize,
  require("./routes/accountRoutes")
);

app.post("/api/listener", listenDeviceData);
app.use("/api/gprs", require("./routes/deviceServiceRoutes"));

// Razorpay
app.use("/api/razorpay", require("./routes/razorpayRoutes"));

// API KEY Routes
app.use("/api-key", authenticateApikey, require("./routes/apikeyRoutes"));

/*************
 * Cron Jobs *
 *************/

cron.schedule("0 0 * * *", async () => {
  if (process.env.NODE_ENV != "production") return;
  if (process.env.NODE_APP_INSTANCE && process.env.NODE_APP_INSTANCE != 0)
    return;

  try {
    await SERVICE.serviceDbBackup();
    await SERVICE.serviceClearHistory();
    await SERVICE.serviceResetAlternateBus();
    await SERVICE.serviceResetCurrAcademicYear();
    await SERVICE.serviceCalculateOverdueAndApplyFine();
  } catch (err) {
    UC.writeLog("errors", `${err.stack}`);
  }
});

// cron.schedule("*/5 * * * * *", async () => {
//   if (process.env.NODE_ENV != "development") return;
//   if (process.env.NODE_APP_INSTANCE && process.env.NODE_APP_INSTANCE != 0)
//     return;

//   try {
//     await SERVICE.serviceDbBackup();
//     await SERVICE.serviceClearHistory();
//     await SERVICE.serviceResetAlternateBus();
//     await SERVICE.serviceResetCurrAcademicYear();
//     await SERVICE.serviceCalculateOverdueAndApplyFine();
//   } catch (err) {
//     UC.writeLog("errors", `${err.stack}`);
//   }
// });

/*************
 * Cron Jobs *
 *************/

/*************
 * Workers Start *
 *************/
const IORedis = require("ioredis");

try {
  const connection = new IORedis({ maxRetriesPerRequest: null });

  WORKER.workerEmailQueue(connection);
  WORKER.workerWhatsappQueue(connection);
  WORKER.workerPushQueue(connection);
} catch (err) {
  UC.writeLog("errors", JSON.stringify(err));
}

/*************
 * Workers End *
 *************/

// test routes
app.use("/api/test", require("./routes/testRoutes"));

app.use(express.static(path.join(__dirname, "build")));

app.all("/api/*", (req, res) =>
  res.status(404).json({ msg: "Url not found!" })
);

app.get("*", (req, res) =>
  res.sendFile(path.resolve(__dirname, "build", "index.html"))
);

app.use(errorHandler);

app.listen(PORT, () =>
  console.log(`${process.env.NAME} running on port: ${PORT}`)
);
