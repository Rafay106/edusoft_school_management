const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    dt: { type: Date, default: new Date() },
    sending: { type: Boolean, default: false },
    sent: { type: Boolean, default: false },
    to: [String],
    subject: { type: String, required },
    text: { type: String, default: "" },
    html: { type: String, default: "" },
    attachments: [String],
  },
  { versionKey: false }
);

schema.plugin(any);

const EmailQ = mongoose.model("queue_email", schema);
module.exports = EmailQ;
