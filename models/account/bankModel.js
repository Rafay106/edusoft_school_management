const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    bank_name: { type: String, required, uppercase: true },
    account_holder: { type: String, required, uppercase: true },
    account_no: { type: String, required, uppercase: true },
    account_type: { type: String, default: "", uppercase: true },
    ifsc: { type: String, required, uppercase: true },
    balance: { type: Number, required: true },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ bank_name: 1 }, { unique: true });
schema.index({ account_no: 1 }, { unique: true });
schema.plugin(any);

const Bank = mongoose.model("account_banks", schema);
module.exports = Bank;
