const mongoose = require("mongoose");
const C = require("../constants");
const { any } = require("../plugins/schemaPlugins");

const schema = new mongoose.Schema(
  {
    admissionNo: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      uppercase: true,
    },
    rollNo: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      uppercase: true,
    },
    name: {
      f: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
      m: { type: String, default: "", uppercase: true },
      l: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    },
    dob: { type: Date, required: [true, C.FIELD_IS_REQ] },
    cast: { type: String, default: "" },
    email: { type: String, required: [true, C.FIELD_IS_REQ] },
    phone: { type: String, required: [true, C.FIELD_IS_REQ] },
    doa: { type: Date, required: [true, C.FIELD_IS_REQ] },
    photo: { type: String, default: "" },
    age: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    address: {
      current: { type: String, default: "" },
      permanent: { type: String, default: "" },
    },
    rfid: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    gender: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      enum: {
        values: ["m", "f", "o"],
        message: C.VALUE_NOT_SUP,
      },
    },
    school: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "schools",
      required: [true, C.FIELD_IS_REQ],
    },
    bus: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "buses",
      required: [true, C.FIELD_IS_REQ],
    },
    busStops: [{ type: mongoose.SchemaTypes.ObjectId, ref: "bus_stops" }],
    class: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "classes",
      required: [true, C.FIELD_IS_REQ],
    },
    section: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "sections",
      required: [true, C.FIELD_IS_REQ],
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
      required: [true, C.FIELD_IS_REQ],
    },
    manager: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
      required: [true, C.FIELD_IS_REQ],
    },
  },
  { timestamps: true }
);

schema.index({ admissionNo: 1 }, { unique: true });
schema.index({ rfid: 1 }, { unique: true });

schema.pre("updateOne", function (next) {
  this.setOptions({ runValidators: true });
  next();
});

schema.pre("updateMany", function (next) {
  this.setOptions({ runValidators: true });
  next();
});

schema.plugin(any);

const Student = mongoose.model("students", schema);
module.exports = Student;
