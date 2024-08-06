const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    dt: { type: Date, default: new Date() },
    sending: { type: Boolean, default: false },
    title: { type: String, required },
    msg: { type: String, required },
    media: {
      app: { type: String, default: "" },
      web: { type: String, default: "" },
    },
    sound: {
      android: { type: String, default: "" },
      ios: { type: String, default: "" },
    },
    receivers: [String],
  },
  { versionKey: false }
);

schema.plugin(any);

const PushQ = mongoose.model("queue_push", schema);
module.exports = PushQ;
