const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const schema = new mongoose.Schema(
  {
    title: { type: String, required: [true, C.FIELD_IS_REQ] },
    orientation: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      enum: { values: ["v", "h"], message: C.VALUE_NOT_SUP },
    },
    user_type: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      enum: {
        values: [C.STUDENT, C.TEACHER, C.BUS_STAFF, C.STAFF],
        message: C.VALUE_NOT_SUP,
      },
    },
    card: {
      height_mm: { type: Number, required: [true, C.FIELD_IS_REQ] },
      width_mm: { type: Number, required: [true, C.FIELD_IS_REQ] },
      background: { type: String, required: [true, C.FIELD_IS_REQ] },
      logo: { type: String, required: [true, C.FIELD_IS_REQ] },
      signature: { type: String, required: [true, C.FIELD_IS_REQ] },
    },
    photo: {
      file: { type: String, required: [true, C.FIELD_IS_REQ] },
      style: {
        type: String,
        required: [true, C.FIELD_IS_REQ],
        enum: { values: ["r", "s"], message: C.VALUE_NOT_SUP },
      },
      height_mm: { type: Number, required: [true, C.FIELD_IS_REQ] },
      width_mm: { type: Number, required: [true, C.FIELD_IS_REQ] },
    },
    layout_padding_mm: {
      top: { type: Number, default: 2.5 },
      bottom: { type: Number, default: 2.5 },
      left: { type: Number, default: 3 },
      right: { type: Number, default: 3 },
    },
    admission_no: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    name: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    class: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    father_name: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    mother_name: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    address: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    phone: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    dob: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    blood: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    house: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    bus_stop: { type: Boolean, required: [true, C.FIELD_IS_REQ] },
    academic_year: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "academic_years",
    },
    school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
  },
  { timestamps: true }
);

schema.plugin(any);

const IdCard = mongoose.model("id_cards", schema);
module.exports = IdCard;
