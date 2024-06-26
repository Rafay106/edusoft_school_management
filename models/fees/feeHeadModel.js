const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    name: { type: String, required: [true, C.FIELD_IS_REQ] },
    alias: { type: String, required: [true, C.FIELD_IS_REQ] },
    fee_type: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "fee_types",
    },
    ledger: { type: String, required: [true, C.FIELD_IS_REQ] },
    academic_year: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "academic_years",
    },
    school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.plugin(any);

const FeeHead = mongoose.model("fee_heads", schema);
module.exports = FeeHead;
