const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const { isEmailValid } = require("../../utils/validators");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const staffSchema = new mongoose.Schema({
  role: {
    type: String,
    required,
    enum: {
      values: [C.ACCOUNTANT, C.LIBRARIAN, C.RECEPTIONIST, C.TEACHER],
      message: C.VALUE_NOT_SUP,
    },
  },
  name: { type: String, required, uppercase: true },
  father_name: { type: String, default: "", uppercase: true },
  mother_name: { type: String, default: "", uppercase: true },
  dob: { type: Date, required },
  doj: { type: Date, required },
  email: {
    type: String,
    required,
    validate: {
      validator: isEmailValid,
      message: C.FIELD_IS_INVALID,
    },
    lowercase: true,
    trim: true,
  },
  gender: {
    type: String,
    required,
    enum: { values: ["m", "f", "o"], message: C.VALUE_NOT_SUP },
  },
  mobile: { type: String, required },
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
    branch: { type: String, default: "" },
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
  manager: { type: ObjectId, required, ref: "users" },
  school: { type: ObjectId, required, ref: "schools" },
});

staffSchema.index({ email: 1 }, { unique: true });

staffSchema.plugin(any);

const Staff = mongoose.model("hr_staffs", staffSchema);
module.exports = Staff;
