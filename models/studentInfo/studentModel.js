const mongoose = require("mongoose");
const C = require("../../constants");
const { any, findByAdmNo } = require("../../plugins/schemaPlugins");
const { isEmailValid } = require("../../utils/validators");
const bcrypt = require("bcrypt");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

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
    admission_no: { type: String, required, uppercase: true },
    admission_serial: { type: String, default: "" },
    student_id: { type: String, default: "" },
    roll_no: { type: String, default: "", uppercase: true },
    name: { type: String, required, uppercase: true },
    class: { type: ObjectId, required, ref: "academics_classes" },
    section: { type: ObjectId, required, ref: "academics_sections" },
    stream: { type: ObjectId, required, ref: "academics_streams" },
    admission_time_class: { type: ObjectId, ref: "academics_classes" },
    gender: {
      type: String,
      required,
      enum: { values: ["m", "f", "o", "na"], message: C.VALUE_NOT_SUP },
    },
    house: { type: String, default: "", uppercase: true },
    blood_group: { type: String, default: "", uppercase: true },
    staff_child: { type: Boolean, default: false },
    doa: { type: Date, required },
    student_status: {
      type: String,
      required,
      enum: { values: ["n", "o"], message: C.VALUE_NOT_SUP },
    },
    student_left: { type: Boolean, default: false },
    phone: { type: String, required },
    father_details: {
      name: { type: String, uppercase: true },
      phone: { type: String, default: "" },
      designation: { type: String, default: "" },
      office_address: { type: String, default: "" },
      job_title: { type: String, default: "" },
      adhaar: { type: String, default: "" },
    },
    mother_details: {
      name: { type: String, uppercase: true },
      phone: { type: String, default: "" },
      job_title: { type: String, default: "" },
      adhaar: { type: String, default: "" },
    },
    dob: { type: Date, required },
    age: { type: Number, default: 0 },
    address: {
      permanent: { type: String, default: "", uppercase: true },
      correspondence: { type: String, default: "", uppercase: true },
    },
    religion: { type: String, default: "", uppercase: true },
    cast: {
      type: String,
      default: "NA",
      uppercase: true,
      enum: {
        values: ["GEN", "OBC", "ST", "SC", "MECON", "OTHERS", "NA"],
        message: C.VALUE_NOT_SUP,
      },
    },
    boarding_type: { type: ObjectId, required, ref: "boarding_types" },
    sub_ward: { type: ObjectId, required, ref: "sub_wards" },
    student_club: { type: String, default: "" },
    student_work_exp: { type: String, default: "" },
    language_2nd: { type: String, default: "" },
    language_3rd: { type: String, default: "" },
    exam_subjects: {
      one: { type: String, default: "" },
      two: { type: String, default: "" },
      three: { type: String, default: "" },
      four: { type: String, default: "" },
      five: { type: String, default: "" },
      six: { type: String, default: "" },
      seven: { type: String, default: "" },
      eigth: { type: String, default: "" },
      nine: { type: String, default: "" },
      ten: { type: String, default: "" },
    },
    ews_applicable: { type: Boolean, default: false },
    bank_details: {
      name: { type: String, default: "", uppercase: true },
      account_type: { type: String, default: "", uppercase: true },
      account_holder: { type: String, default: "", uppercase: true },
      account_no: { type: String, default: "", uppercase: true },
      ifsc: { type: String, default: "", uppercase: true },
    },
    relation_with_student: { type: String, default: "", uppercase: true },
    class_teacher: { type: String, default: "", uppercase: true },
    bus_pick: { type: ObjectId, ref: "transport_buses" },
    bus_drop: { type: ObjectId, ref: "transport_buses" },
    bus_stop: { type: ObjectId, ref: "transport_bus_stops" },
    student_adhaar: { type: String, default: "" },
    sibling: { type: Boolean, default: false },
    single_girl_child: { type: Boolean, default: false },
    handicapped: { type: Boolean, default: false },
    email: {
      type: String,
      required,
      validate: { validator: isEmailValid, message: C.FIELD_IS_INVALID },
      lowercase: true,
      trim: true,
    },
    photo: { type: String, default: "" },
    age: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    rfid: { type: String, required, uppercase: true },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    parent: { type: ObjectId, ref: "users" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ admission_no: 1 }, { unique: true });
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
schema.plugin(findByAdmNo);

const Student = mongoose.model("students", schema);
module.exports = Student;
