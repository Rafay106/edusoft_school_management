const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

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
    name: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    doj: { type: Date, required: [true, C.FIELD_IS_REQ] },
    email: { type: String, default: "" },
    phone: { type: String, required: [true, C.FIELD_IS_REQ] },
    alt_phone: { type: String, default: "" },
    photo: { type: String, default: "" },
    driving_license: {
      number: { type: String, default: "", uppercase: true },
      expiry_date: { type: Date, default: 0 },
    },
    school: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "schools",
    },
    manager: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
  },
  { timestamps: true, versionKey: false }
);

schema.plugin(any);

const BusStaff = mongoose.model("bus_staffs", schema);
module.exports = BusStaff;
