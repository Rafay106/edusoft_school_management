const { default: axios } = require("axios");
const Bus = require("../models/transport/busModel");
const getDeviceHistoryModel = require("../models/transport/deviceHistoryModel");
const { insert_db_loc } = require("./insert");

const serviceClearHistory = async () => {
  const days = parseInt(process.env.HISTORY_PERIOD);

  if (!days || isNaN(days)) return;

  if (days < 30) return;

  const buses = await Bus.find().select("device.imei").sort("imei");

  for (const bus of buses) {
    const DeviceHistory = getDeviceHistoryModel(bus.device.imei);

    await DeviceHistory.deleteMany({
      dt_tracker: {
        $lt: new Date().setUTCDate(new Date().getUTCDate() - days),
      },
    });
  }
};

const serviceResetAlternateBus = async () => {
  await Bus.updateMany(
    { "alternate.enabled": true },
    { $set: { "alternate.enabled": false } }
  );
};

const serviceInsertData = async () => {
  const { data } = await axios.get(
    `https://www.speedotrack.in/api/api.php?api=user&ver=1.0&key=6DBC43AC16B9126419E52DEA3753EB30&cmd=USER_GET_OBJECTS`
  );

  for (const device of data) {
    const loc = {
      altitude: device.altitude,
      angle: device.angle,
      dt_server: new Date(),
      dt_tracker: device.dt_tracker,
      event: device.event,
      imei: device.imei,
      ip: device.ip,
      lat: device.lat,
      lon: device.lng,
      loc_valid: device.loc_valid,
      net_protocol: device.net_protocol,
      params: device.params,
      port: device.port,
      protocol: device.protocol,
      speed: device.speed,
    };

    await insert_db_loc(loc);
  }
};

module.exports = {
  serviceClearHistory,
  serviceResetAlternateBus,
  serviceInsertData,
};
