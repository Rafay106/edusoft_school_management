const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    name: { type: String, required, uppercase: true },
    description: { type: String, default: "" },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ name: 1, academic_year: 1 }, { unique: true });
schema.plugin(any);

const FeeGroup = mongoose.model("fee_groups", schema);
module.exports = FeeGroup;
