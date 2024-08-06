const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const { isEmailValid } = require("../../utils/validators");

const ObjectId = mongoose.Schema.Types.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const staffSchema = new mongoose.Schema(
  {
    staff_no: { type: String, required },
    role: { type: ObjectId, required, ref: "system_roles" },
    department: { type: ObjectId, required, ref: "hr_departments" },
    designation: { type: ObjectId, required, ref: "hr_designations" },
    name: {
      first: { type: String, required, uppercase: true },
      last: { type: String, default: "", uppercase: true },
    },
    father_name: { type: String, required, uppercase: true },
    mother_name: { type: String, required, uppercase: true },
    email: {
      type: String,
      required,
      validate: { validator: isEmailValid, message: C.FIELD_IS_INVALID },
      lowercase: true,
      trim: true,
    },
    gender: {
      type: String,
      required,
      enum: { values: ["m", "f", "o"], message: C.VALUE_NOT_SUP },
    },
    dob: { type: Date, default: 0 },
    doj: { type: Date, default: 0 },
    mobile: {
      primary: { type: String, required },
      emergency: { type: String, default: "" },
    },
    marital_status: {
      type: String,
      required,
      enum: {
        values: ["m", "u", "na"], // married, unmarried, not available
        message: C.VALUE_NOT_SUP,
      },
    },
    driving_license: { type: String, default: "" },
    photo: { type: String, default: "" },
    expert_staff: { type: String, default: "no", enum: ["yes", "no"] },
    address: {
      current: { type: String, default: "" },
      permanent: { type: String, default: "" },
    },
    qualification: { type: String, default: "" },
    experience: { type: String, default: "" },
    payroll_details: {
      epf_no: { type: String, default: "" },
      basic_salary: { type: Number, default: "" },
      contract_type: {
        type: String,
        enum: { values: ["per", "con"], message: C.VALUE_NOT_SUP },
      },
      location: { type: String, default: "" },
    },
    bank_details: {
      account_name: { type: String, default: "" },
      account_no: { type: String, default: "" },
      bank_name: { type: String, default: "" },
      branch_name: { type: String, default: "" },
    },
    social_details: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    document_info: {
      resume: { type: String, default: "" },
      joining_letter: { type: String, default: "" },
      other_document: { type: String, default: "" },
    },
  },
  { timestamps: true, versionKey: false }
);

staffSchema.index({ staff_no: 1 }, { unique: true });
staffSchema.index({ email: 1 }, { unique: true });

const Staff = mongoose.model("hr_staffs", staffSchema);
module.exports = Staff;
