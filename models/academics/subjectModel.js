const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    name: { type: String, required, uppercase: true },
    code: { type: String, required, uppercase: true },
    type: {
      type: String,
      required,
      enum: { values: ["T", "P"], message: C.VALUE_NOT_SUP },
    },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true }
);

schema.index({ name: 1, school: 1 }, { unique: true });
schema.index({ code: 1, school: 1 }, { unique: true });
schema.plugin(any);

const Subject = mongoose.model("academics_subjects", schema);
module.exports = Subject;
