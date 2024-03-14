const mongoose = require("mongoose");
const C = require("../constants");
const { isEmailValid, timeValidator } = require("../utils/validators");
const { any } = require("../plugins/schemaPlugins");

const schema = new mongoose.Schema(
  {
    name: { type: String, required: [true, C.FIELD_IS_REQ] },
    email: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      validate: {
        validator: isEmailValid,
        message: C.FIELD_IS_INVALID,
      },
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: [true, C.FIELD_IS_REQ] },
    address: { type: String, required: [true, C.FIELD_IS_REQ] },
    country: { type: String, required: [true, C.FIELD_IS_REQ] },
    state: { type: String, required: [true, C.FIELD_IS_REQ] },
    city: { type: String, required: [true, C.FIELD_IS_REQ] },
    pincode: { type: String, required: [true, C.FIELD_IS_REQ] },
    lat: { type: Number, required: [true, C.FIELD_IS_REQ] },
    lon: { type: Number, required: [true, C.FIELD_IS_REQ] },
    radius: { type: Number, required: [true, C.FIELD_IS_REQ] },
    timings: {
      morning: {
        type: String,
        required: [true, C.FIELD_IS_REQ],
        validate: {
          validator: timeValidator,
          message: (props) =>
            `${props.value} is not a valid 24-hour time format (HH:MM)!`,
        },
      },
      afternoon: {
        type: String,
        required: [true, C.FIELD_IS_REQ],
        validate: {
          validator: timeValidator,
          message: (prop) => {
            return `${prop.value} is not a valid 24-hour time format (HH:MM)!`;
          },
        },
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "users",
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "users",
    },
  },
  { timestamps: true }
);

schema.index({ email: 1 }, { unique: true });
schema.index({ user: 1 }, { unique: true });

schema.pre("updateOne", function (next) {
  this.setOptions({ runValidators: true });
  next();
});

schema.pre("updateMany", function (next) {
  this.setOptions({ runValidators: true });
  next();
});

schema.plugin(any);

const School = mongoose.model("schools", schema);
module.exports = School;
