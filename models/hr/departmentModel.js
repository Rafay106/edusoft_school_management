const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    name: { type: String, required, uppercase: true },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ name: 1 }, { unique: true });
schema.plugin(any);

const Department = mongoose.model("hr_departments", schema);
module.exports = Department;
