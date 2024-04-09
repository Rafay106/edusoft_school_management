const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const sectionsSchema = new mongoose.Schema({
  section: {
    type: ObjectId,
    required: [true, C.FIELD_IS_REQ],
    ref: "sections",
  },
});

const schema = new mongoose.Schema(
  {
    name: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    sections: [
      { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "sections" },
    ],
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
schema.plugin(any);

const Class = mongoose.model("classes", schema);
module.exports = Class;
