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
    school: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "schools",
    },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ name: 1, academic_year: 1, school: 1 }, { unique: true });
schema.plugin(any);

const Stream = mongoose.model("academics_streams", schema);
module.exports = Stream;
