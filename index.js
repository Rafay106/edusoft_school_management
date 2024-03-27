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
} = require("./middlewares/authMiddleware");
const { listenDeviceData } = require("./services/listener");
const {
  serviceClearHistory,
  serviceResetAlternateBus,
} = require("./services/service");
const { writeLog } = require("./utils/common");

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

app.use("/api/system", authenticate, require("./routes/systemRoutes"));
app.use("/api/login", require("./routes/authRoutes"));
app.use("/api/util", authenticate, require("./routes/utilRoutes"));
app.use("/api/academics", authenticate, require("./routes/academicRoutes"));
app.use(
  "/api/student-info",
  authenticate,
  require("./routes/studentInfoRoutes")
);
app.use("/api/transport", authenticate, require("./routes/transportRoutes"));
app.use("/api/hr", authenticate, require("./routes/hrRoutes"));
app.use("/api/fee", authenticate, require("./routes/feeRoutes"));

app.post("/api/listener", listenDeviceData);
// app.post("/api/listener/mobile", listenMobileData);

app.use("/api/parent", parentAuthenticate, require("./routes/parentRoutes"));

// Razorpay
app.use("/api/razorpay", require("./tools/razorpay"));

/*************
 * Cron Jobs *
 *************/

// cron.schedule("* * * * * *", () => {
//   console.time("sendPush");
//   sendPushNotification();
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
