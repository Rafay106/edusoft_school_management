const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    student: { type: ObjectId, required, ref: "students" },
    fee_term: { type: ObjectId, required, ref: "fee_terms" },
    amount: { type: Number, required },
    note: { type: String, default: "" },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false }
);

schema.plugin(any);

const StudentFine = mongoose.model("fee_fine_students", schema);
module.exports = StudentFine;
