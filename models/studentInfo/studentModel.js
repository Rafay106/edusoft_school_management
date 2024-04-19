const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const { isEmailValid } = require("../../utils/validators");
const bcrypt = require("bcrypt");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const addressSchema = new mongoose.Schema(
  {
    house: { type: String, default: "", uppercase: true },
    street: { type: String, default: "", uppercase: true },
    city: { type: String, default: "", uppercase: true },
    state: { type: String, default: "", uppercase: true },
    pincode: { type: Number, default: "", uppercase: true },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    admission_no: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      uppercase: true,
    },
    roll_no: { type: String, default: "", uppercase: true },
    name: {
      f: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
      m: { type: String, default: "", uppercase: true },
      l: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    },
    father_name: {
      f: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
      m: { type: String, default: "", uppercase: true },
      l: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    },
    mother_name: {
      f: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
      m: { type: String, default: "", uppercase: true },
      l: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    },
    dob: { type: Date, required: [true, C.FIELD_IS_REQ] },
    cast: {
      type: String,
      default: "NA",
      uppercase: true,
      enum: {
        values: ["GEN", "OBC", "ST", "SC", "OTHERS", "NA"],
        message: C.VALUE_NOT_SUP,
      },
    },
    student_type: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "student_types",
    },
    email: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      validate: { validator: isEmailValid, message: C.FIELD_IS_INVALID },
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: [true, C.FIELD_IS_REQ] },
    doa: { type: Date, required: [true, C.FIELD_IS_REQ] },
    photo: { type: String, default: "" },
    age: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    address: { current: addressSchema, permanent: addressSchema },
    rfid: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    gender: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      enum: { values: ["m", "f", "o"], message: C.VALUE_NOT_SUP },
    },
    house: { type: String, default: "" },
    blood_group: { type: String, default: "" },
    academic_year: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "academic_years",
    },
    class: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "classes" },
    section: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "sections",
    },
    bus: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "buses" },
    bus_stop: { type: ObjectId, ref: "bus_stops" },
    parent: { type: ObjectId, ref: "users" },
    school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
  },
  { timestamps: true }
);

schema.index({ admission_no: 1 }, { unique: true });
schema.index({ email: 1 }, { unique: true });
schema.index({ rfid: 1 }, { unique: true });

schema.pre("save", async function (next) {
  next();
});

schema.pre("updateOne", async function (next) {
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
