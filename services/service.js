const Bus = require("../models/transport/busModel");
const getDeviceHistoryModel = require("../models/transport/deviceHistoryModel");

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

module.exports = { serviceClearHistory, serviceResetAlternateBus };
