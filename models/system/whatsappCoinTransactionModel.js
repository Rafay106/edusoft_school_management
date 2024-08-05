const mongoose = require("mongoose");
const C = require("../../constants");

const required = [true, C.FIELD_IS_REQ];

const transactionSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      required,
      enum: { values: ["debit", "credit"], message: C.VALUE_NOT_SUP },
    },
    coins: {
      amount: { type: Number, required },
      previous: { type: Number, required },
      final: { type: Number, required },
    },
  },
  { timestamps: true, versionKey: false }
);

const WhatsappCoinTransaction = mongoose.model(
  "whatsapp_coin_transactions",
  transactionSchema
);
module.exports = WhatsappCoinTransaction;
