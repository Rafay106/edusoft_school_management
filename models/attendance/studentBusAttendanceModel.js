const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const attendanceTypeSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required,
      enum: {
        values: [C.M_ENTRY, C.M_EXIT, C.A_ENTRY, C.A_EXIT, C.UNKNOWN],
        message: C.VALUE_NOT_SUP,
      },
    },
    time: { type: Date, required },
    lat: { type: Number, required },
    lon: { type: Number, required },
    address: { type: String, required },
    msg: { type: String, required },
    bus: { type: ObjectId, required, ref: "transport_buses" },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    date: { type: Date, required },
    bus: { type: ObjectId, ref: "transport_buses" },
    student: { type: ObjectId, required, ref: "students" },
    list: [attendanceTypeSchema],
  },
  { timestamps: true, versionKey: false }
);

schema.index({ date: 1, student: 1 }, { unique: true });
schema.index({ "list.tag": 1, date: 1, student: 1 }, { unique: true });

schema.pre("save", function (next) {
  if (this.date) this.date = new Date(this.date).setUTCHours(0, 0, 0, 0);
  next();
});

schema.pre("updateOne", function (next) {
  this.setOptions({ runValidators: true });
  next();
});

schema.plugin(any);

const StuBusAtt = mongoose.model("attendance_bus_students", schema);
module.exports = StuBusAtt;
