const mongoose = require("mongoose");
const C = require("../../constants");
const { isEmailValid } = require("../../utils/validators");
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
    email: {
      type: String,
      default: "",
      validate: { validator: isEmailValid, message: C.FIELD_IS_INVALID },
      lowercase: true,
      trim: true,
    },
    phone: {
      primary: { type: String, required },
      secondary: { type: String, default: "" },
    },
    photo: { type: String, default: "" },
    driving_license: {
      number: { type: String, default: "", uppercase: true },
      expiry_date: { type: Date, default: 0 },
    },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $exists: true, $gt: "" },
    },
  }
);
schema.index({ "phone.primary": 1 }, { unique: true });
schema.index(
  { "phone.secondary": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "phone.secondary": { $exists: true, $gt: "" },
    },
  }
);

schema.plugin(any);

const BusStaff = mongoose.model("transport_bus_staffs", schema);
module.exports = BusStaff;
