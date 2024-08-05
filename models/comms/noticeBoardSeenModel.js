const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    notice: { type: ObjectId, required, ref: "comms_noticeboard" },
    seens: [{ type: ObjectId, required, ref: "users" }],
  },
  { timestamps: true, versionKey: false }
);

schema.index({ notice: 1 }, { unique: true });

schema.plugin(any);

const NoticeSeen = mongoose.model("comms_noticeboard_seens", schema);
module.exports = NoticeSeen;
