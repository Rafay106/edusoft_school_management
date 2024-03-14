const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const schema = new mongoose.Schema({
  name: { type: String, required: [true, C.FIELD_IS_REQ] },
  address: { type: String, required: [true, C.FIELD_IS_REQ] },
  lat: { type: Number, required: [true, C.FIELD_IS_REQ] },
  lon: { type: Number, required: [true, C.FIELD_IS_REQ] },
  fees: { type: Number, required: [true, C.FIELD_IS_REQ] },
  manager: {
    type: mongoose.SchemaTypes.ObjectId,
    required: [true, C.FIELD_IS_REQ],
    ref: "users",
  },
  school: {
    type: mongoose.SchemaTypes.ObjectId,
    required: [true, C.FIELD_IS_REQ],
    ref: "users",
  },
});

schema.index({ name: 1, user: 1 }, { unique: true });

schema.plugin(any);

const BusStop = mongoose.model("bus_stops", schema);
module.exports = BusStop;
