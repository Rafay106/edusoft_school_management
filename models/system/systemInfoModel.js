const mongoose = require("mongoose");
const C = require("../../constants");

const required = [true, C.FIELD_IS_REQ];

const systemSchema = new mongoose.Schema(
  {
    key: { type: String, required },
    value: { type: String, required },
  },
  { timestamps: true, versionKey: false }
);

systemSchema.index({ key: 1 }, { unique: true });

const SystemInfo = mongoose.model("system_infos", systemSchema);
module.exports = SystemInfo;
