const mongoose = require("mongoose");
const C = require("../../constants");
const { isEmailValid, timeValidator } = require("../../utils/validators");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const timingErr = (props) => {
  return `${props.value} is not a valid 24-hour time format (HH:MM)!`;
};

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
    email_verified: { type: Boolean, default: false },
    phone: { type: String, required: [true, C.FIELD_IS_REQ] },
    phone_verified: { type: Boolean, default: false },
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
        validate: { validator: timeValidator, message: timingErr },
      },
      afternoon: {
        type: String,
        required: [true, C.FIELD_IS_REQ],
        validate: { validator: timeValidator, message: timingErr },
      },
    },
    bus_incharge: {
      name: { type: String, default: "" },
      email: {
        type: String,
        default: "",
        validate: {
          validator: function (value) {
            // Only validate if email is provided

            if (this._update) {
              const email = this._update["$set"]["bus_incharge.email"];
              return !email || isEmailValid(value);
            }
            return !this.email || isEmailValid(value);
          },
          message: C.FIELD_IS_INVALID,
        },
        lowercase: true,
        trim: true,
      },
      phone: { type: String, default: "" },
    },
    library: {
      fine_per_day: { type: Number, default: 0 },
      book_issue_limit: { type: Number, default: 0 },
      book_issue_days: { type: Number, default: 0 },
    },
    current_academic_year: { type: ObjectId, ref: "academic_years" },
    manager: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ name: 1, manager: 1 }, { unique: true });
schema.index({ email: 1 }, { unique: true });

schema.pre("updateOne", function (next) {
  this.setOptions({ runValidators: true });

  const emailToUpdate = this.getUpdate().$set?.email;
  if (emailToUpdate) {
    this.updateOne({}, { $set: { email_verified: false } });
  }

  const phoneToUpdate = this.getUpdate().$set?.phone;
  if (phoneToUpdate) {
    this.updateOne({}, { $set: { phone_verified: false } });
  }

  next();
});

schema.pre("updateMany", function (next) {
  this.setOptions({ runValidators: true });

  const emailToUpdate = this.getUpdate().$set?.email;
  if (emailToUpdate) {
    this.updateOne({}, { $set: { email_verified: false } });
  }

  const phoneToUpdate = this.getUpdate().$set?.phone;
  if (phoneToUpdate) {
    this.updateOne({}, { $set: { phone_verified: false } });
  }

  next();
});

schema.plugin(any);

const School = mongoose.model("schools", schema);
module.exports = School;
