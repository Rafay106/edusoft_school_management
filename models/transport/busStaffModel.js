const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    type: {
      type: String,
      required,
      enum: { values: ["d", "c"], message: C.VALUE_NOT_SUP },
    },
    name: { type: String, required, uppercase: true },
    doj: { type: Date, required },
    email: { type: String, default: "" },
    phone: { type: String, required },
    photo: { type: String, default: "" },
    driving_license: {
      number: { type: String, default: "", uppercase: true },
      expiry_date: { type: Date, default: 0 },
    },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ phone: 1 }, { unique: true });
schema.plugin(any);

const BusStaff = mongoose.model("transport_bus_staffs", schema);
module.exports = BusStaff;
