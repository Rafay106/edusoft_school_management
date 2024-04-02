const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema({
  name: { type: String, required: [true, C.FIELD_IS_REQ] },
  address: { type: String, required: [true, C.FIELD_IS_REQ] },
  fare: { type: Number, required: [true, C.FIELD_IS_REQ] },
  lat: { type: Number, required: [true, C.FIELD_IS_REQ] },
  lon: { type: Number, required: [true, C.FIELD_IS_REQ] },
  manager: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
  school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
});

schema.index({ name: 1, school: 1 }, { unique: true });

schema.plugin(any);

const BusStop = mongoose.model("bus_stops", schema);
module.exports = BusStop;
