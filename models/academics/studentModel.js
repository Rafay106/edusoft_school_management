const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

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
    academic_year: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "academic_years",
    },
    class: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "classes" },
    bus: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "buses" },
    bus_stop: { type: ObjectId, ref: "bus_stops" },
    manager: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
    school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
  },
  { timestamps: true }
);

schema.index({ admission_no: 1 }, { unique: true });
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
