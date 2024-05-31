const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    title: { type: String, required },
    notice: { type: String, default: "" },
    publish_date: { type: Date, required },
    file: { type: String, default: "" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.plugin(any);

const Notice = mongoose.model("comms_noticeboard", schema);
module.exports = Notice;
