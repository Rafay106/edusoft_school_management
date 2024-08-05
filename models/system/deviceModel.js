const mongoose = require("mongoose");
const C = require("../../constants");
const { isIMEIValid } = require("../../utils/validators");
const { any } = require("../../plugins/schemaPlugins");

const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    imei: {
      type: String,
      required,
      validate: { validator: isIMEIValid, message: "Invalid imei!" },
      uppercase: true,
    },
    type: {
      type: String,
      required,
      enum: { values: [C.BUS, C.SCHOOL, C.TEST], message: C.VALUE_NOT_SUP },
    },
    protocol: { type: String, default: "" },
    net_protocol: { type: String, default: "" },
    ip: { type: String, default: "" },
    port: { type: String, default: "" },
    dt_server: { type: Date, default: 0 },
    dt_tracker: { type: Date, default: 0 },
    lat: { type: Number, default: 0 },
    lon: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    altitude: { type: Number, default: 0 },
    angle: { type: Number, default: 0 },
    params: { type: Object, default: {} },
    loc_valid: { type: Boolean, default: false },
    vehicle_status: {
      last_stop: { type: Date, default: 0 },
      last_idle: { type: Date, default: 0 },
      last_move: { type: Date, default: 0 },
      is_stopped: { type: Boolean, default: false },
      is_idle: { type: Boolean, default: false },
      is_moving: { type: Boolean, default: false },
    },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

schema.index({ imei: 1 }, { unique: true });

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

  this.vehicle_status = vStat;

  next();
});

schema.plugin(any);

const Device = mongoose.model("system_devices", schema);
module.exports = Device;
