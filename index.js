require("dotenv").config();

// Connect to db
require("./config/db")();

const express = require("express");
const morgan = require("morgan");
const fs = require("node:fs");
const path = require("node:path");
const cron = require("node-cron");
const { errorHandler } = require("./middlewares/errorMiddleware");
const {
  authenticate,
  parentAuthorize,
  schoolAuthorize,
  authorize,
} = require("./middlewares/authMiddleware");
const UM = require("./middlewares/utilMiddleware");
const { listenDeviceData } = require("./services/listener");
const SERVICE = require("./services/service");
const NOTY = require("./tools/notifications");
const UC = require("./utils/common");

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

const logPath = path.join(__dirname, "logs");
if (!fs.existsSync(logPath)) fs.mkdirSync(logPath, { recursive: true });

const accessLogStream = fs.createWriteStream(path.join(logPath, "access.log"), {
  flags: "a",
});

app.use(morgan("combined", { stream: accessLogStream }));
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "static")));
app.use(express.static(path.join(__dirname, "data")));

// Routes Start

app.post("/api/init", require("./controllers/systemController").init);

app.use(
  "/api/system",
  authenticate,
  authorize,
  require("./routes/systemRoutes")
);
app.use("/api/login", require("./routes/authRoutes"));
app.use(
  "/api/util",
  authenticate,
  schoolAuthorize,
  require("./routes/utilRoutes")
);
app.use(
  "/api/academics",
  authenticate,
  schoolAuthorize,
  require("./routes/academicRoutes")
);
app.use(
  "/api/admin-section",
  authenticate,
  schoolAuthorize,
  require("./routes/adminSectionRoutes")
);
app.use(
  "/api/student-info",
  authenticate,
  schoolAuthorize,
  require("./routes/studentInfoRoutes")
);
app.use(
  "/api/transport",
  authenticate,
  schoolAuthorize,
  require("./routes/transportRoutes")
);
app.use("/api/hr", authenticate, schoolAuthorize, require("./routes/hrRoutes"));
app.use(
  "/api/fee",
  authenticate,
  schoolAuthorize,
  require("./routes/feeRoutes")
);
app.use(
  "/api/dashboard",
  authenticate,
  schoolAuthorize,
  require("./routes/dashboardRoutes")
);
app.use(
  "/api/library",
  authenticate,
  schoolAuthorize,
  require("./routes/libraryRoutes")
);
app.use(
  "/api/comms",
  authenticate,
  schoolAuthorize,
  require("./routes/commsRoutes")
);
app.use(
  "/api/library",
  authenticate,
  schoolAuthorize,
  require("./routes/libraryRoutes")
);
app.use(
  "/api/homework",
  authenticate,
  schoolAuthorize,
  require("./routes/homeworkRoutes")
);

app.use(
  "/api/parent-util",
  authenticate,
  parentAuthorize,
  require("./routes/parentUtilRoutes")
);
app.use(
  "/api/parent",
  authenticate,
  parentAuthorize,
  require("./routes/parentRoutes")
);

app.post("/api/listener", listenDeviceData);
app.use("/api/gprs", require("./routes/deviceServiceRoutes"));

// Razorpay
app.use("/api/razorpay", require("./tools/razorpay_old"));

/*************
 * Cron Jobs *
 *************/

cron.schedule("* * * * *", async () => {
  if (process.env.NODE_ENV != "production") return;
  if (process.env.NODE_APP_INSTANCE != 0) return;

  try {
    await NOTY.sendPushNoty();
    await NOTY.sendEmailNoty();
    await NOTY.sendWhatsappNoty();
  } catch (err) {
    UC.writeLog("errors", `${err.stack}`);
  }
});

cron.schedule("0 0 * * *", async () => {
  if (process.env.NODE_ENV != "production") return;
  if (process.env.NODE_APP_INSTANCE != 0) return;

  try {
    await SERVICE.serviceClearHistory();
    await SERVICE.serviceResetAlternateBus();
    await SERVICE.serviceResetCurrAcademicYear();
    await SERVICE.serviceCalculateOverdueAndApplyFine();
  } catch (err) {
    UC.writeLog("errors", `${err.stack}`);
  }
});

// CRON TEST
// cron.schedule("* * * * * *", async () => {
//   if (process.env.NODE_ENV != "development") return;
// });

/*************
 * Cron Jobs *
 *************/

// test routes
app.use("/api/test", require("./routes/testRoutes"));

// app.use(express.static(path.join(__dirname, "dist")));

// app.get("*", (req, res) =>
//   res.sendFile(path.resolve(__dirname, "dist", "index.html"))
// );

app.all("*", (req, res) => res.status(404).json({ msg: "Url not found!" }));

app.use(errorHandler);

app.listen(PORT, () => console.log(`Edusoft running on port: ${PORT}`));
