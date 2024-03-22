const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    name: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    code: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    type: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      enum: { values: ["T", "P"], message: C.VALUE_NOT_SUP },
    },
    academic_year: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "academic_years",
    },
    manager: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
    school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
  },
  { timestamps: true }
);

schema.index({ name: 1, school: 1 }, { unique: true });
schema.index({ code: 1, school: 1 }, { unique: true });
schema.plugin(any);

const Subject = mongoose.model("subjects", schema);
module.exports = Subject;
