const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const C = require("../../constants");
const { isEmailValid, isUsernameValid } = require("../../utils/validators");
const { any } = require("../../plugins/schemaPlugins");

const privilegesSchema = new mongoose.Schema({
  user: {
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  school: {
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  busStaff: {
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  busStop: {
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  bus: {
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  student: {
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  util: {
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
});

const schema = new mongoose.Schema(
  {
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
    password: { type: String, required: [true, C.FIELD_IS_REQ] },
    username: {
      type: String,
      validate: {
        validator: isUsernameValid,
        message: (props) => `${props.value} is an invalid username!`,
      },
      trim: true,
    },
    name: {
      f: { type: String, required: [true, C.FIELD_IS_REQ] },
      m: { type: String, default: "" },
      l: { type: String, required: [true, C.FIELD_IS_REQ] },
    },
    phone: { type: String, required: [true, C.FIELD_IS_REQ] },
    type: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      enum: {
        values: [
          C.SUPERADMIN,
          C.ADMIN,
          C.MANAGER,
          C.SCHOOL,
          C.ACCOUNTANT,
          C.BUS_STAFF,
          C.LIBRARIAN,
          C.PARENT,
          C.RECEPTIONIST,
        ],
        message: C.VALUE_NOT_SUP,
      },
    },
    privileges: privilegesSchema,
    manager: { type: mongoose.SchemaTypes.ObjectId, ref: "users" },
    school: { type: mongoose.SchemaTypes.ObjectId, ref: "users" },
  },
  { timestamps: true }
);

schema.index({ email: 1 }, { unique: true });

schema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (this.type === C.USER) {
    if (!this.manager) {
      throw new Error("manager is required!");
    }
  }

  next();
});

schema.pre("updateOne", function (next) {
  this.setOptions({ runValidators: true });
  next();
});

schema.pre("updateMany", function (next) {
  this.setOptions({ runValidators: true });
  next();
});

schema.plugin(any);

const User = mongoose.model("users", schema);
module.exports = User;
