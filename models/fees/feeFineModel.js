const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
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
    boarding_type: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "boarding_types",
    },
    desc: [
      {
        serial: { type: Number, required: [true, C.FIELD_IS_REQ] },
        type: {
          type: String,
          required: [true, C.FIELD_IS_REQ],
          enum: {
            values: ["f", "d", "w", "m"], // fixed, daily, weekly, monthly
            message: C.VALUE_NOT_SUP,
          },
        },
        amount: { type: Number, required: [true, C.FIELD_IS_REQ] },
        range: {
          start: { type: Number, required: [true, C.FIELD_IS_REQ] },
          end: { type: Number, required: [true, C.FIELD_IS_REQ] },
        },
        fixed: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
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

schema.index({ class: 1, fee_term: 1, boarding_type: 1 }, { unique: true });
schema.index({ _id: 1, "desc.serial": 1 }, { unique: true });
schema.plugin(any);

const FeeFine = mongoose.model("fee_fines", schema);
module.exports = FeeFine;
