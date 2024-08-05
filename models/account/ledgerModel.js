const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    mode: {
      type: String,
      required,
      enum: {
        values: [C.CASH, C.ONLINE, C.CHEQUE_OR_DD, C.POS_MACHINE],
        message: C.VALUE_NOT_SUP,
      },
    },
    type: {
      type: String,
      required,
      enum: { values: [C.CREDIT, C.DEBIT], message: C.VALUE_NOT_SUP },
    },
    amount: { type: Number, required },
    balance: { type: Number, required },
    note: { type: String, required },
    chart: { type: ObjectId, required, ref: "account_charts" },
    bank: { type: ObjectId, ref: "account_banks" },
  },
  { timestamps: true, versionKey: false }
);

schema.plugin(any);

const Ledger = mongoose.model("account_ledgers", schema);
module.exports = Ledger;
