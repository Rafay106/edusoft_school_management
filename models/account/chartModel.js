const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    head: { type: String, required, uppercase: true },
    type: {
      type: String,
      required,
      enum: { values: [C.EXPENSE, C.INCOME], message: C.VALUE_NOT_SUP },
    },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ head: 1 }, { unique: true });
schema.plugin(any);

const Chart = mongoose.model("account_charts", schema);
module.exports = Chart;
