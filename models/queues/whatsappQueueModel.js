const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    dt: { type: Date, default: new Date() },
    sending: { type: Boolean, default: false },
    campaignName: { type: String, required },
    destinations: [String],
    templateParams: [String],
    media: {
      url: { type: String, default: "" },
      filename: { type: String, default: "" },
    },
  },
  { versionKey: false }
);

schema.plugin(any);

const WhatsAppQ = mongoose.model("queue_whatsapp", schema);
module.exports = WhatsAppQ;
