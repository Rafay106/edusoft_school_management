const getDeviceHistoryModel = require("../models/system/deviceHistoryModel");
const Device = require("../models/system/deviceModel");
const UnusedDevice = require("../models/system/unusedDeviceModel");
const {
  getAngle,
  getLenBtwPointsInKm,
  writeLog,
  getAppRootDir,
} = require("../utils/common");
const { isAlphaNumeric } = require("../utils/validators");
const {
  studentBusAttendance,
  studentClassAttendance,
} = require("./attendance");
const C = require("../constants");

const insert_db_loc = async (loc) => {
  console.log("*****insert_db_loc() START*****");

  // Format Data
  loc.imei = loc.imei.trim().toUpperCase();
  loc.loc_valid = loc.loc_valid === "1";
  loc.lat = parseFloat(parseFloat(loc.lat).toFixed(6));
  loc.lon = parseFloat(parseFloat(loc.lon).toFixed(6));
  loc.altitude = Math.floor(loc.altitude);
  loc.angle = Math.floor(loc.angle);
  loc.speed = Math.floor(loc.speed);
  loc.protocol = loc.protocol.toLowerCase();
  loc.net_protocol = loc.net_protocol.toLowerCase();
  loc.dt_tracker = new Date(loc.dt_tracker.replace(" ", "T") + "Z");

  // check for wrong IMEI
  if (!isAlphaNumeric(loc.imei)) return false;

  if (isNaN(loc.lat)) {
    writeLog(
      "insert",
      `Error: loc.lat is NaN | imei: ${loc.imei} | dt_tracker: ${loc.dt_tracker}`
    );

    return false;
  }

  if (isNaN(loc.lon)) {
    writeLog(
      "insert",
      `Error: loc.lon is NaN | imei: ${loc.imei} | dt_tracker: ${loc.dt_tracker}`
    );

    return false;
  }

  // check for wrong speed
  // if (loc.speed > 1000) return false;

  // check if device exists in system
  const device = await Device.findOne({ imei: loc.imei }).lean();

  if (!device) {
    await insert_db_unused(loc);
    return false;
  }

  // // apply GPS Roll Over fix
  // const now = new Date();
  // if (
  //   loc.dt_tracker.getUTCFullYear() > now.getUTCFullYear() + 10 ||
  //   loc.dt_tracker.getUTCFullYear() < now.getUTCFullYear() - 10
  // ) {
  //   if (
  //     loc.dt_tracker.getUTCMonth() === now.getUTCMonth() &&
  //     loc.dt_tracker.getUTCDate() === now.getUTCDate()
  //   ) {
  //     loc.dt_tracker.setUTCFullYear(now.getUTCFullYear());
  //   } else {
  //     loc.dt_tracker = new Date(now);
  //   }
  // }

  // // check if dt_tracker is one day too far - skip coordinate
  // if (loc.dt_tracker >= new Date(now.getTime() + 86400000)) {
  //   return false;
  // }

  // check if dt_tracker is at least one hour too far - set 0 UTC time
  // if (loc.dt_tracker >= new Date(now.getTime() + 3600000)) {
  //   loc.dt_tracker = new Date(now);
  // }

  // adjust GPS time
  // loc.dt_tracker = await adjustDeviceTime(loc.imei, loc.dt_tracker);

  // get previous known location
  let locPrev = await getDeviceData(loc.imei);

  // // avoid incorrect lat and lon signs
  // if (loc.lat != locPrev.lat) {
  //   if (Math.abs(loc.lat) === Math.abs(locPrev.lat)) {
  //     return false;
  //   }
  // }

  // if (loc.lon != locPrev.lon) {
  //   if (Math.abs(loc.lon) === Math.abs(locPrev.lon)) {
  //     return false;
  //   }
  // }

  // merge params only if dt_tracker is newer
  if (loc.dt_tracker >= locPrev.dt_tracker) {
    loc.params = { ...locPrev.params, ...loc.params };
  }

  // sort params array
  loc.params = Object.keys(loc.params)
    .sort()
    .reduce((obj, key) => {
      obj[key] = loc.params[key];
      return obj;
    }, {});

  // // check if location without valid lat and lon
  // if (!loc.loc_valid && (loc.lat === 0 || loc.lon === 0)) {
  //   if (loc.dt_tracker >= locPrev.dt_tracker) {
  //     // add previous known location
  //     loc.lat = locPrev.lat;
  //     loc.lon = locPrev.lon;
  //     loc.altitude = locPrev.altitude;
  //     loc.angle = locPrev.angle;
  //     loc.speed = 0;
  //   }
  // }

  // insert data into various services
  await updateDeviceLocData(loc, locPrev);

  await updateDeviceStatus(loc, locPrev);

  // check for duplicate locations
  // if (locFilter(loc, locPrev)) return;

  // Save history of device
  await insertDeviceHistory(loc);

  // if (loc.lat == 0 || loc.lon == 0) return;

  // if (loc.dt_tracker < locPrev.dt_tracker) return;

  writeLog(
    "insert",
    `${loc.imei} | ${loc.dt_tracker.toISOString()} | ${JSON.stringify(
      loc.params
    )}`
  );
  if (!loc.params.io78 || loc.params.io78 === "0") return;

  if (device.type === C.BUS) {
    const result = await studentBusAttendance(loc);
    console.log("result :>> ", result);
  } else if (device.type === C.SCHOOL) {
    const result = await studentClassAttendance(loc);
    console.log("result :>> ", result);
  } else if (device.type === C.TEST) {
    const fs = require("node:fs");

    fs.writeFileSync("./latest_scanned_rfid.txt", loc.params.io78);
  }

  console.log("*****insert_db_loc() END*****");
};

const insert_db_unused = async (loc) => {
  const exists = await UnusedDevice.any({ imei: loc.imei });
  let result;
  if (!exists) {
    result = await UnusedDevice.create({
      imei: loc.imei,
      protocol: loc.protocol,
      net_protocol: loc.net_protocol,
      ip: loc.ip,
      port: loc.port,
      dt_server: loc.dt_server,
      count: 1,
    });
  } else {
    result = await UnusedDevice.updateOne(
      { imei: loc.imei },
      {
        $set: {
          protocol: loc.protocol,
          net_protocol: loc.net_protocol,
          ip: loc.ip,
          port: loc.port,
          dt_server: loc.dt_server,
        },
        $inc: { count: 1 },
      }
    );
  }

  return result;
};

const updateDeviceLocData = async (loc, locPrev) => {
  let res;

  if (loc.dt_tracker >= locPrev.dt_tracker) {
    if (loc.loc_valid) {
      // Calculate angle
      if (loc.angle === 0) {
        loc.angle = getAngle(locPrev.lat, locPrev.lon, loc.lat, loc.lon);
      }

      console.log("loc.angle :>> ", loc.angle);

      res = await Device.updateOne(
        { imei: loc.imei },
        {
          $set: {
            protocol: loc.protocol,
            net_protocol: loc.net_protocol,
            ip: loc.ip,
            port: loc.port,
            dt_server: loc.dt_server,
            dt_tracker: loc.dt_tracker,
            lat: loc.lat,
            lon: loc.lon,
            speed: loc.speed,
            altitude: loc.altitude,
            angle: loc.angle,
            params: loc.params,
            loc_valid: true,
          },
        }
      );
    } else {
      loc.speed = 0;
      if (loc.lat !== 0 && loc.lon !== 0) {
        res = await Device.updateOne(
          { imei: loc.imei },
          {
            $set: {
              protocol: loc.protocol,
              net_protocol: loc.net_protocol,
              ip: loc.ip,
              port: loc.port,
              dt_server: loc.dt_server,
              dt_tracker: loc.dt_tracker,
              lat: loc.lat,
              lon: loc.lon,
              speed: loc.speed,
              altitude: loc.altitude,
              angle: loc.angle,
              params: loc.params,
              loc_valid: false,
            },
          }
        );
      } else {
        res = await Device.updateOne(
          { imei: loc.imei },
          {
            $set: {
              protocol: loc.protocol,
              net_protocol: loc.net_protocol,
              ip: loc.ip,
              port: loc.port,
              dt_server: loc.dt_server,
              dt_tracker: loc.dt_tracker,
              speed: loc.speed,
              params: loc.params,
              loc_valid: false,
            },
          }
        );
      }
    }
  } else {
    res = await Device.updateOne(
      { imei: loc.imei },
      {
        $set: {
          protocol: loc.protocol,
          net_protocol: loc.net_protocol,
          ip: loc.ip,
          port: loc.port,
          dt_server: loc.dt_server,
        },
      }
    );
  }

  return res;
};

const insertDeviceHistory = async (loc) => {
  // if (loc.lat === 0 && loc.lon === 0) return false;

  const DeviceHistory = getDeviceHistoryModel(loc.imei);
  const res = await DeviceHistory.create({
    dt_server: loc.dt_server,
    dt_tracker: loc.dt_tracker,
    lat: loc.lat,
    lon: loc.lon,
    altitude: loc.altitude,
    angle: loc.angle,
    speed: loc.speed,
    params: loc.params,
    // odometer: loc.odometer,
    // engine_hours: loc.engine_hours,
  });

  return res;
};

const updateDeviceStatus = async (loc, locPrev) => {
  if (loc.dt_tracker < locPrev.dt_tracker) return;

  if (!locPrev.vehicle_status) {
    locPrev.vehicle_status = {
      last_stop: new Date(0),
      last_idle: new Date(0),
      last_move: new Date(0),
      is_stopped: false,
      is_idle: false,
      is_moving: false,
    };
  }

  const vStat = locPrev.vehicle_status;

  // status stop
  if (
    loc.speed === 0 &&
    (vStat.last_stop.getTime() === 0 || vStat.last_stop < vStat.last_move)
  ) {
    vStat.last_stop = loc.dt_server;
  }

  if (loc.loc_valid) {
    // status moving
    if (loc.speed > 0 && vStat.last_move <= vStat.last_stop) {
      vStat.last_move = loc.dt_server;
    }
  }

  // status idle
  if (vStat.last_stop >= vStat.last_move) {
    const acc = "io239";
    if (!loc.params[acc]) return;

    if (loc.params[acc] === "1" && vStat.last_idle.getTime() === 0) {
      vStat.last_idle = loc.dt_server;
    } else if (loc.params[acc] === "0" && vStat.last_idle > 0) {
      vStat.last_idle = new Date(0);
    }
  } else {
    if (vStat.last_idle > 0) {
      vStat.last_idle = new Date(0);
    }
  }

  await Device.updateOne(
    { imei: loc.imei },
    { $set: { vehicle_status: vStat } }
  );
};

const getDeviceData = async (imei) => {
  const device = await Device.findOne({ imei }).lean();

  if (!device) return false;

  // Format Data
  device.lat = parseFloat(device.lat);
  device.lon = parseFloat(device.lon);
  device.params = device.params || {};
  return device;
};

const locFilter = (loc, locPrev) => {
  if (!process.env.LOCATION_FILTER === "true") return false;

  if (!loc.lat || !loc.lon || !loc.params) return false;

  if (loc.event !== "" || locPrev.params !== loc.params) return false;

  const dt_difference = Math.abs(
    new Date(loc.dt_server) - new Date(locPrev.dt_server)
  );

  if (dt_difference >= 120000) return false;

  // skip same location
  if (
    locPrev.lat == loc.lat &&
    locPrev.lon == loc.lon &&
    locPrev.speed == loc.speed
  ) {
    return true;
  }

  // skip drift
  distance = getLenBtwPointsInKm(locPrev.lat, locPrev.lon, loc.lat, loc.lon);

  if (
    dt_difference < 30000 &&
    distance < 0.01 &&
    loc.speed < 3 &&
    locPrev.speed == 0
  ) {
    return true;
  }

  return false;
};

module.exports = {
  insert_db_loc,
};
