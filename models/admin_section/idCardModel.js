const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    title: { type: String, required },
    orientation: {
      type: String,
      required,
      enum: { values: ["v", "h"], message: C.VALUE_NOT_SUP },
    },
    user_type: {
      type: String,
      required,
      enum: {
        values: [C.STUDENT, C.TEACHER, C.BUS_STAFF, C.STAFF],
        message: C.VALUE_NOT_SUP,
      },
    },
    card: {
      height_mm: { type: Number, required },
      width_mm: { type: Number, required },
      background: { type: String, required },
      logo: { type: String, required },
      signature: { type: String, required },
    },
    photo: {
      file: { type: String, required },
      style: {
        type: String,
        required,
        enum: { values: ["r", "s"], message: C.VALUE_NOT_SUP },
      },
      height_mm: { type: Number, required },
      width_mm: { type: Number, required },
    },
    layout_padding_mm: {
      top: { type: Number, default: 2.5 },
      bottom: { type: Number, default: 2.5 },
      left: { type: Number, default: 3 },
      right: { type: Number, default: 3 },
    },
    admission_no: { type: Boolean, required },
    name: { type: Boolean, required },
    class: { type: Boolean, required },
    father_name: { type: Boolean, required },
    mother_name: { type: Boolean, required },
    address: { type: Boolean, required },
    phone: { type: Boolean, required },
    dob: { type: Boolean, required },
    blood: { type: Boolean, required },
    house: { type: Boolean, required },
    bus_stop: { type: Boolean, required },
    academic_year: {
      type: ObjectId,
      required,
      ref: "academic_years",
    },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true }
);

schema.plugin(any);

const IdCard = mongoose.model("id_cards", schema);
module.exports = IdCard;
