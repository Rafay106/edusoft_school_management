const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const staffSchema = new mongoose.Schema({
  role: {
    type: String,
    required: [true, C.FIELD_IS_REQ],
    enum: {
      values: [C.ACCOUNTANT, C.DRIVER, C.LIBRARIAN, C.RECEPTIONIST, C.TEACHER],
      message: C.VALUE_NOT_SUP,
    },
  },
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
  doj: { type: Date, required: [true, C.FIELD_IS_REQ] },
  email: { type: String, required: [true, C.FIELD_IS_REQ] },
  phone: { type: String, required: [true, C.FIELD_IS_REQ] },
  emergency_phone: { type: String, default: "" },
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
  bank_account_name: { type: String, default: "" },
  bank_account_no: { type: String, default: "" },
  bank_name: { type: String, default: "" },
  bank_brach: { type: String, default: "" },
  facebook_url: { type: String, default: "" },
  twiteer_url: { type: String, default: "" },
  linkedin_url: { type: String, default: "" },
  instragram_url: { type: String, default: "" },
  joining_letter: { type: String, default: "" },
  resume: { type: String, default: "" },
  other_document: { type: String, default: "" },
  notes: { type: String, default: "" },
  driving_license: { type: String, default: "" },
  driving_license_ex_date: { type: String, default: "" },
});

staffSchema.plugin(any);

const Accountant = mongoose.model("accountants", staffSchema);
module.exports = Accountant;
