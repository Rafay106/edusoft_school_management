const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const fineDescSchema = new mongoose.Schema(
  {
    amount: { type: Number, required },
    from: { type: Date, required },
    to: { type: Date, required },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    boarding_type: { type: ObjectId, required, ref: "boarding_types" },
    type: {
      type: String,
      required,
      enum: {
        values: [C.FIXED, C.DAILY, C.WEEKLY, C.MONTHLY, C.CUSTOM],
        message: C.VALUE_NOT_SUP,
      },
    },
    amount: { type: Number, default: 0 },
    custom: [fineDescSchema],
    academic_year: { type: ObjectId, required, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ boarding_type: 1, academic_year: 1 }, { unique: true });
schema.plugin(any);

const FeeFine = mongoose.model("fee_fines", schema);
module.exports = FeeFine;
