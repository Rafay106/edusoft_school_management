const mongoose = require("mongoose");
const C = require("../../constants");
const { isIMEIValid } = require("../../utils/validators");
const { any } = require("../../plugins/schemaPlugins");

const deviceSchema = new mongoose.Schema(
  {
    imei: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      validate: {
        validator: isIMEIValid,
        message: "Invalid imei!",
      },
      uppercase: true,
    },
    name: { type: String, required: [true, C.FIELD_IS_REQ] },
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
    status: { type: String, default: "" },
  },
  { minimize: false }
);

const schema = new mongoose.Schema(
  {
    name: { type: String, required: [true, C.FIELD_IS_REQ] },
    status: {
      value: { type: String, default: "none" },
      dt: { type: Date, default: 0 },
    },
    alternate: {
      enabled: { type: Boolean, default: false },
      bus: { type: mongoose.SchemaTypes.ObjectId, ref: "buses" },
    },
    device: deviceSchema,
    stops: [{ type: mongoose.SchemaTypes.ObjectId, ref: "bus_stops" }],
    driver: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "bus_staffs",
    },
    conductor: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "bus_staffs",
    },
    manager: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "users",
    },
    school: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "users",
    },
  },
  { timestamps: true, minimize: false }
);

schema.index({ name: 1 }, { unique: true });
schema.index({ "device.imei": 1 }, { unique: true });

schema.plugin(any);

const Bus = mongoose.model("buses", schema);
module.exports = Bus;
