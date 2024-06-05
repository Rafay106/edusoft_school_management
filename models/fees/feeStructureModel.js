const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const feetypeSchema = new mongoose.Schema(
  {
    boarding_type: { type: ObjectId, required, ref: "boarding_types" },
    amounts: [
      {
        fee_type: { type: ObjectId, required, ref: "fee_types" },
        amount: { type: Number, required },
      },
    ],
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    fee_term: { type: ObjectId, required, ref: "fee_terms" },
    class: { type: ObjectId, required, ref: "academics_classes" },
    fee_types: [feetypeSchema],
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ fee_term: 1, class: 1, stream: 1 }, { unique: true });
schema.index({ _id: 1, "fee_types.fee_type": 1 }, { unique: true });
schema.index(
  { _id: 1, "fee_types.amounts.boarding_type": 1 },
  { unique: true }
);
schema.plugin(any);

const FeeStructure = mongoose.model("fee_structures", schema);
module.exports = FeeStructure;
