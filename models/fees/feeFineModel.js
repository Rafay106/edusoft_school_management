const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const findDescSchema = new mongoose.Schema(
  {
    serial: { type: Number, required },
    type: {
      type: String,
      required,
      enum: {
        values: ["f", "d", "w", "m"], // fixed, daily, weekly, monthly
        message: C.VALUE_NOT_SUP,
      },
    },
    amount: { type: Number, required },
    range: { start: { type: Date, required }, end: { type: Date, required } },
    fixed: { type: Boolean, required },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    class: { type: ObjectId, required, ref: "academics_classes" },
    fee_term: { type: ObjectId, required, ref: "fee_terms" },
    boarding_type: { type: ObjectId, required, ref: "boarding_types" },
    desc: [findDescSchema],
    academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ class: 1, fee_term: 1, boarding_type: 1 }, { unique: true });
schema.index({ _id: 1, "desc.serial": 1 }, { unique: true });
schema.plugin(any);

const FeeFine = mongoose.model("fee_fines", schema);
module.exports = FeeFine;
