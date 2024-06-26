const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const attendanceTypeSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      enum: {
        values: [C.M_ENTRY, C.M_EXIT, C.A_ENTRY, C.A_EXIT, C.UNKNOWN],
        message: C.VALUE_NOT_SUP,
      },
    },
    time: { type: Date, required: [true, C.FIELD_IS_REQ] },
    lat: { type: Number, required: [true, C.FIELD_IS_REQ] },
    lon: { type: Number, required: [true, C.FIELD_IS_REQ] },
    address: { type: String, required: [true, C.FIELD_IS_REQ] },
    msg: { type: String, required: [true, C.FIELD_IS_REQ] },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    date: { type: Date, required: [true, C.FIELD_IS_REQ] },
    student: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "students",
    },
    bus: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "buses" },
    list: [attendanceTypeSchema],
  },
  { timestamps: true }
);

schema.index({ date: 1, student: 1 }, { unique: true });

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
