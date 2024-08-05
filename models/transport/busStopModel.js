const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    name: { type: String, required, uppercase: true },
    address: { type: String, required, uppercase: true },
    monthly_charges: { type: Number, required },
    lat: { type: Number, required },
    lon: { type: Number, required },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ name: 1 }, { unique: true });

schema.plugin(any);

const BusStop = mongoose.model("transport_bus_stops", schema);
module.exports = BusStop;
