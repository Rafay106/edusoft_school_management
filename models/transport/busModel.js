const mongoose = require("mongoose");
const C = require("../../constants");
const { isIMEIValid } = require("../../utils/validators");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const deviceSchema = new mongoose.Schema(
  {
    imei: {
      type: String,
      required,
      validate: { validator: isIMEIValid, message: "Invalid imei!" },
      uppercase: true,
    },
    // name: { type: String, required },
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
  { minimize: false }
);

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
    alternate: {
      enabled: { type: Boolean, default: false },
      bus: { type: ObjectId, ref: "transport_buses" },
    },
    temp_device: {
      enabled: { type: Boolean, default: false },
      imei: { type: String, default: "" },
      bus: { type: ObjectId, ref: "transport_buses" },
    },
    device: deviceSchema,
    stops: [{ type: ObjectId, ref: "transport_bus_stops" }],
    driver: { type: ObjectId, required, ref: "transport_bus_staffs" },
    conductor: { type: ObjectId, required, ref: "transport_bus_staffs" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, minimize: false, versionKey: false }
);

schema.index({ name: 1, school: 1 }, { unique: true });
schema.index({ "device.imei": 1 }, { unique: true });

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
