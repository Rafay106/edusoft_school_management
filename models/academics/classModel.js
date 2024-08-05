const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    name: { type: String, required, uppercase: true },
    sections: [{ type: ObjectId, required, ref: "academics_sections" }],
    stream: { type: ObjectId, required, ref: "academics_streams" },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.index(
  { name: 1, stream: 1, academic_year: 1, school: 1 },
  { unique: true }
);
schema.plugin(any);

const Class = mongoose.model("academics_classes", schema);
module.exports = Class;
