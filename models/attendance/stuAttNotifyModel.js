const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    date: { type: Date, required: [true, C.FIELD_IS_REQ] },
    msg: { type: String, required: [true, C.FIELD_IS_REQ] },
    student: { type: mongoose.SchemaTypes.ObjectId, ref: "students" },
    sent: { type: Boolean, default: false },
    bus: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "buses" },
    manager: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
    school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
  },
  { timestamps: true }
);

schema.plugin(any);

const StuAttNotification = mongoose.model("stu_att_notifications", schema);
module.exports = StuAttNotification;
