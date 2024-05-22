const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    name: { type: String, required },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true }
);

schema.plugin(any);

const Department = mongoose.model("departments", schema);
module.exports = Department;
