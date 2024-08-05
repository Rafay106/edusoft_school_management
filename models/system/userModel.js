const mongoose = require("mongoose");
const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const C = require("../../constants");
const UC = require("../../utils/common");
const { isEmailValid, isUsernameValid } = require("../../utils/validators");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const schema = new mongoose.Schema(
  {
    name: { type: String, required },
    email: {
      type: String,
      default: "",
      validate: { validator: isEmailValid, message: C.FIELD_IS_INVALID },
      lowercase: true,
      trim: true,
    },
    email_verified: { type: Boolean, default: false },
    username: {
      type: String,
      default: "",
      validate: { validator: isUsernameValid, message: C.FIELD_IS_INVALID },
      trim: true,
    },
    password: { type: String, required },
    phone: { type: String, required },
    phone_verified: { type: Boolean, default: false },
    role: { type: ObjectId, required, ref: "system_roles" },
    api_key: { type: String, default: "" },
    school: { type: ObjectId, ref: "schools" },
    current_academic_year: { type: ObjectId, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false }
);

schema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $exists: true, $gt: "" },
    },
  }
);
schema.index({ phone: 1 }, { unique: true });
schema.index(
  { username: 1 },
  {
    unique: true,
    partialFilterExpression: {
      username: { $exists: true, $gt: "" },
    },
  }
);

schema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (!this.api_key || this.api_key === "") {
    this.api_key = crypto.randomBytes(32).toString("hex");
  }

  next();
});

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

const User = mongoose.model("users", schema);
module.exports = User;
