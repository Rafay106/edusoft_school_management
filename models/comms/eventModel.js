const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    title: { type: String, required },
    location: { type: String, required },
    from_date: { type: Date, required },
    to_date: { type: Date, required },
    desc: { type: String, required },
    sent_to: {
      teacher: { type: Boolean, default: false },
      parent: { type: Boolean, default: false },
      student: { type: Boolean, default: false },
      accountant: { type: Boolean, default: false },
      bus_staff: { type: Boolean, default: false },
      librarian: { type: Boolean, default: false },
      receptionist: { type: Boolean, default: false },
    },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

schema.plugin(any);

const Notice = mongoose.model("comms_noticeboard", schema);
module.exports = Notice;
