const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const schema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      enum: {
        values: ["d", "c"], // driver, conductor
        message: C.VALUE_NOT_SUP,
      },
    },
    name: {
      f: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
      m: { type: String, default: "", uppercase: true },
      l: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    },
    doj: { type: Date, required: [true, C.FIELD_IS_REQ] },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    photo: { type: String, default: "" },
    driving_license: {
      number: { type: String, default: "" },
      expiry_date: { type: Date, default: 0 },
    },
    manager: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
      required: [true, C.FIELD_IS_REQ],
    },
    school: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
      required: [true, C.FIELD_IS_REQ],
    },
  },
  { timestamps: true }
);

schema.plugin(any);

const BusStaff = mongoose.model("bus_staffs", schema);
module.exports = BusStaff;
