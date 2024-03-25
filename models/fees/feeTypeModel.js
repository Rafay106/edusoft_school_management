const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    name: { type: String, required: [true, C.FIELD_IS_REQ] },
    description: { type: String, default: "" },
    fee_group: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "fee_groups",
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

schema.index({ name: 1, fee_group: 1, school: 1 }, { unique: true });
schema.plugin(any);

const FeeType = mongoose.model("fee_types", schema);
module.exports = FeeType;
