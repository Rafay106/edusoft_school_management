const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const { isEmailValid } = require("../../utils/validators");

const ObjectId = mongoose.Schema.Types.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const staffSchema = new mongoose.Schema(
  {
    saluation: {
      type: String,
      default: "",
      enum: {
        values: [
          "CA",
          "Dr",
          "Late Mr.",
          "Late Mrs.",
          "Late.",
          "MD.",
          "Mr.",
          "Ms.",
          "SINGLE PARENT",
        ],
      },
    },
    photo: { type: String, default: "" },
    sign: { type: String, default: "" },
    staff_id: { type: String, required },
    name: { type: String, required, uppercase: true },
    primary_mobile: { type: String, default: "" },
    staff_type: {
      type: String,
      enum: {
        values: ["c", "P", "T"], //confirmation probabtion temporary,
        message: C.VALUE_NOT_SUP,
      },
    },
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
    mobile: { type: String, default: "" },
    birth_date: { type: Date, default: 0 },
    designation: { type: ObjectId, required, ref: "hr_designations" },
    role: {
      type: String,
      required,
      enum: {
        values: [C.ACCOUNTANT, C.LIBRARIAN, C.RECEPTIONIST, C.TEACHER],
        message: C.VALUE_NOT_SUP,
      },
    },
    biometric: { type: String, default: "" },
    rfid: { type: String, required },
    date_of_regular: { type: Date, default: "" },
    wing: { type: String, default: "" },
    marital_status: {
      type: String,
      default: "na",
      enum: {
        values: ["m", "u", "na"], // married, unmarried, not available
        message: C.VALUE_NOT_SUP,
      },
    },
    sequence_no: { type: String, default: "" },
    confirmation_date: { type: Date, default: "" },
    reporting_authority: { type: ObjectId, default: "" },
    intercommunication: { type: String, default: "" },
     
    religion: {
      type: String,
      enum: {
        values: [
          "Hinduism",
          "Islam",
          "Christianity",
          "Sikhism",
          "Buddhism",
          "Jainism",
          "Others",
        ],
        message: C.VALUE_NOT_SUP,
      },
    },
    joining_date: { type: Date, default: 0 },
    gender: {
      type: String,
      required,
      enum: { values: ["m", "f", "o"], message: C.VALUE_NOT_SUP },
    },
    blood_group: {
      type: String,
      enum: {
        values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        message: C.VALUE_NOT_SUP,
      },
    },
    department: { type: ObjectId, required, ref: "hr_departments" },
    service_end_date: { type: Date, default: "" },
    incharge: { type: String, default: "" },
    class_interchange: { type: String, default: "" },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      pin: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
    },
    family: {
      father_name: { type: String, default: "", uppercase: true },
      mother_name: { type: String, default: "", uppercase: true },
      spouse_name: { type: String, default: "", uppercase: true },
      father_profession: { type: String, default: "", uppercase: true },
      spouse_profession: { type: String, default: "", uppercase: true },
      mother_profession: { type: String, default: "", uppercase: true },
      father_contact: { type: Number, default: "" },
      mother_contact: { type: Number, default: "" },
      spouse_contact: { type: Number, default: "" },
    },
    nationality: { type: String, required },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionkey: false }
);

staffSchema.index(
  { email: 1, rfid: 1, staff_id: 1, biometric: 1,biometric:1 },
  { unique: true }
);
staffSchema.plugin(any);

const Staff = mongoose.model("hr_staffs", staffSchema);
module.exports = Staff;
