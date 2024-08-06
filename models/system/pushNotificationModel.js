const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    type: {
      type: String,
      required,
      enum: {
        values: [C.ATTENDANCE_BUS, C.ATTENDANCE_CLASS, C.FEE, C.NOTICE, C.MISC],
        message: C.VALUE_NOT_SUP,
      },
    },
    msg: { type: String, required },
    media: { type: String, default: "" },
    user: { type: ObjectId, required, ref: "users" },
  },
  { timestamps: true, versionKey: false }
);

schema.plugin(any);

schema.index({ user: 1 });

const PushNotification = mongoose.model("push_notifications", schema);
module.exports = PushNotification;
