const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    name: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
    address: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      uppercase: true,
    },
    fare: { type: Number, required: [true, C.FIELD_IS_REQ] },
    lat: { type: Number, required: [true, C.FIELD_IS_REQ] },
    lon: { type: Number, required: [true, C.FIELD_IS_REQ] },
    school: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "schools",
    },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ name: 1, school: 1 }, { unique: true });

schema.plugin(any);

const BusStop = mongoose.model("transport_bus_stops", schema);
module.exports = BusStop;
