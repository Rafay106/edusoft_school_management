const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const schema = new mongoose.Schema(
  {
    name: { type: String, required: [true, C.FIELD_IS_REQ] },
    manager: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
      required: [true, C.FIELD_IS_REQ],
    },
    school: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
      required: [true, C.FIELD_IS_REQ],
    },
  },
  { timestamps: true }
);

schema.plugin(any);

const Class = mongoose.model("classes", schema);
module.exports = Class;
