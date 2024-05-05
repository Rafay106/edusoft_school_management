const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema({
  student: {
    type: ObjectId,
    required: [true, C.FIELD_IS_REQ],
    ref: "students",
  },
  terms: {
    term: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "fee_terms",
    },
    amount: { type: Number, required: [true, C.FIELD_IS_REQ] },
  },
});

schema.index({ student: 1 }, { unique: true });

schema.plugin(any);

const FeeGenerated = mongoose.model("generated_fees", schema);
module.exports = FeeGenerated;
