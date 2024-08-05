const asyncHandler = require("express-async-handler");
const { insert_db_loc } = require("./insert");
const { writeLog } = require("../utils/common");

const listenDeviceData = asyncHandler(async (req, res) => {
  const data = req.body;

  for (const loc of data) {
    // console.time("listener");

    loc.dt_server = new Date();
    loc.params = JSON.parse(loc.params);
    loc.lon = loc.lng;
    delete loc.lng;

    if (loc.op === "loc") {
      await insert_db_loc(loc);
    }

    // console.timeEnd("listener");
  }

  // forward to dpsranchi
  // try {
  //   const response = await axios.post(
  //     "https://dpsranchi.edusoft.in/api/listener",
  //     data,
  //     { headers: { "Content-Type": "application/json" } }
  //   );

  //   writeLog(
  //     "dpsranchi_listener",
  //     JSON.stringify({ status: response.status, data: response.data })
  //   );
  // } catch (error) {
  //   writeLog("errors", "listener.listenDeviceData - " + JSON.stringify(error));
  // }
  // forward to dpsranchi

  res.status(200).json({ success: true });
});

const listenMobileData = asyncHandler(async (req, res) => {
  const data = req.body;

  writeLog("listenMobileData", JSON.parse(data));

  res.status(200).json({ success: true });
});

module.exports = { listenDeviceData, listenMobileData };
