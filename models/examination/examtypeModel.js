const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const required = [true, C.FIELD_IS_REQ];

const examTypeSchema = new mongoose.Schema(
  { name: { type: String, required, uppercase: true } },
  { timestamps: true, versionKey: false }
);

examTypeSchema.plugin(any);

const ExamType = mongoose.model("exam_type", examTypeSchema);
module.exports = ExamType;
