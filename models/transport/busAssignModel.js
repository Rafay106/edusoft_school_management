const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const assignmentDetailSchema = new mongoose.Schema(
  {
    date: { type: Date, default: 0 },
    month: { type: Date, default: 0 },
    status: {
      type: String,
      required,
      enum: {
        values: [C.ASSIGNED, C.UNASSIGNED],
        message: C.VALUE_NOT_SUP,
      },
    },
    bus_stop: { type: ObjectId, ref: "transport_bus_stops" },
    bus_pick: { type: ObjectId, ref: "transport_buses" },
    bus_drop: { type: ObjectId, ref: "transport_buses" },
    assigned_by: { type: ObjectId, ref: "users" },
    released_by: { type: ObjectId, ref: "users" },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    student: { type: ObjectId, required, ref: "students" },
    list: [assignmentDetailSchema],
    academic_year: { type: ObjectId, required, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ student: 1, academic_year: 1 }, { unique: true });
schema.index(
  { "list.date": 1, student: 1, academic_year: 1 },
  { unique: true }
);
schema.plugin(any);

const BusAssignment = mongoose.model("transport_bus_assignments", schema);
module.exports = BusAssignment;
