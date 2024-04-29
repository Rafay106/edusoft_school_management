const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const { isEmailValid } = require("../../utils/validators");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const staffSchema = new mongoose.Schema({
  role: {
    type: String,
    required: [true, C.FIELD_IS_REQ],
    enum: {
      values: [C.ACCOUNTANT, C.LIBRARIAN, C.RECEPTIONIST, C.TEACHER],
      message: C.VALUE_NOT_SUP,
    },
  },
  name: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
  father_name: { type: String, default: "", uppercase: true },
  mother_name: { type: String, default: "", uppercase: true },
  dob: { type: Date, required: [true, C.FIELD_IS_REQ] },
  doj: { type: Date, required: [true, C.FIELD_IS_REQ] },
  email: {
    type: String,
    required: [true, C.FIELD_IS_REQ],
    validate: {
      validator: isEmailValid,
      message: C.FIELD_IS_INVALID,
    },
    lowercase: true,
    trim: true,
  },
  gender: {
    type: String,
    required: [true, C.FIELD_IS_REQ],
    enum: { values: ["m", "f", "o"], message: C.VALUE_NOT_SUP },
  },
  mobile: { type: String, required: [true, C.FIELD_IS_REQ] },
  emergency_mobile: { type: String, default: "" },
  marital_status: {
    type: String,
    default: "na",
    enum: {
      values: ["m", "u", "na"], // married, unmarried, not available
      message: C.VALUE_NOT_SUP,
    },
  },
  photo: { type: String, default: "" },
  address: {
    current: { type: String, default: "" },
    permanent: { type: String, default: "" },
  },
  qualification: { type: String, default: "" },
  experience: { type: String, default: "" },
  epf_no: { type: String, default: "" },
  basic_salary: { type: String, default: "" },
  contract_type: { type: String, default: "" },
  location: { type: String, default: "" },
  casual_leave: { type: String, default: "" },
  medical_leave: { type: String, default: "" },
  metarnity_leave: { type: String, default: "" },
  bank: {
    account_name: { type: String, default: "" },
    account_no: { type: String, default: "" },
    name: { type: String, default: "" },
    brach: { type: String, default: "" },
  },
  url: {
    facebook: { type: String, default: "" },
    twiteer: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    instragram: { type: String, default: "" },
  },
  joining_letter: { type: String, default: "" },
  resume: { type: String, default: "" },
  other_document: { type: String, default: "" },
  notes: { type: String, default: "" },
  driving_license: { type: String, default: "" },
  driving_license_ex_date: { type: Date, default: "" },
  department: { type: ObjectId, ref: "departments" },
  designation: { type: ObjectId, ref: "designations" },
  manager: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
  school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
});

staffSchema.index({ email: 1 }, { unique: true });

staffSchema.plugin(any);

const Staff = mongoose.model("staffs", staffSchema);
module.exports = Staff;
