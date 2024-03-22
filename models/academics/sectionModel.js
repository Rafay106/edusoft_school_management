const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const schema = new mongoose.Schema(
  {
    name: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    academic_year: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "academic_years",
    },
    manager: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "users",
    },
    school: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "users",
    },
  },
  { timestamps: true }
);

schema.index({ name: 1, school: 1 }, { unique: true });
schema.plugin(any);

const Section = mongoose.model("sections", schema);
module.exports = Section;
