const mongoose = require("mongoose");
const C = require("../../constants");
const { isIMEIValid } = require("../../utils/validators");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const stopSchema = new mongoose.Schema(
  {
    number: { type: Number, required },
    stop: { type: ObjectId, required, ref: "bus_stops" },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    name: { type: String, required, uppercase: true },
    no_plate: { type: String, required, uppercase: true },
    model: { type: String, required, uppercase: true },
    year_made: { type: String, default: "" },
    status: {
      value: { type: String, default: "none" },
      dt: { type: Date, default: 0 },
    },
    // alternate: {
    //   enabled: { type: Boolean, default: false },
    //   bus: { type: ObjectId, ref: "transport_buses" },
    // },
    temp_device: {
      enabled: { type: Boolean, default: false },
      imei: { type: String, default: "" },
      bus: { type: ObjectId, ref: "transport_buses" },
    },
    device: { type: ObjectId, required, ref: "system_devices" },
    stops: [{ type: ObjectId, ref: "transport_bus_stops" }],
    driver: { type: ObjectId, required, ref: "transport_bus_staffs" },
    conductor: { type: ObjectId, required, ref: "transport_bus_staffs" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, minimize: false, versionKey: false }
);

schema.index({ name: 1 }, { unique: true });
schema.index({ device: 1 }, { unique: true });

schema.pre("updateOne", function (next) {
  const data = this.getUpdate().$set;

  if (!data.vehicle_status) return next();

  const vStat = data.vehicle_status;

  if (vStat.last_stop >= vStat.last_move) {
    vStat.is_stopped = true;
    vStat.is_idle = false;
    vStat.is_moving = false;
  } else {
    vStat.is_stopped = false;
    vStat.is_idle = false;
    vStat.is_moving = true;
  }

  if (
    vStat.last_stop <= vStat.last_idle &&
    vStat.last_move <= vStat.last_idle
  ) {
    vStat.is_stopped = false;
    vStat.is_idle = true;
    vStat.is_moving = false;
  }

  this.device.vehicle_status = vStat;

  next();
});

schema.plugin(any);

const Bus = mongoose.model("transport_buses", schema);
module.exports = Bus;
