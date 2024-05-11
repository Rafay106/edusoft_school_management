const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    subward: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "sub_wards",
    },
    class: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "academics_classes",
    },
    fee_term: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "fee_terms",
    },
    fee_types: [
      {
        fee_type: {
          type: ObjectId,
          required: [true, C.FIELD_IS_REQ],
          ref: "fee_types",
        },
        is_percentage: { type: Boolean, default: false },
        amount: { type: Number, required: [true, C.FIELD_IS_REQ] },
      },
    ],
    academic_year: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "academic_years",
    },
    school: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "schools",
    },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ subward: 1, class: 1, fee_term: 1 });
schema.plugin(any);

const FeeConcession = mongoose.model("fee_concessions", schema);
module.exports = FeeConcession;
