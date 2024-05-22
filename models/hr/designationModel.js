const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    title: { type: String, required },
    school: { type: ObjectId, required, ref: "schools" },
    academic_year: { type: ObjectId, required, ref: "academic_years" }
  },
  { timestamps: true }
);

schema.plugin(any);

const Designation = mongoose.model("designations", schema);
module.exports = Designation;
