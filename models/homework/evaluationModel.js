const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");
const ObjectId = mongoose.SchemaTypes.ObjectId;
const evaluationSchema = new mongoose.Schema(
  {
    student: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "students",
    },
    homework: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "homeworks",
    },
    marks: { type: Number, required: [true, C.FIELD_IS_REQ] },
    comments: {
      type: String,
      enum: ["g", "ng"],
      required: [true, C.FIELD_IS_REQ],
    },
    status: {
      type: String,
      enum: ["i", "c"],
      required: [true, C.FIELD_IS_REQ],
    },
    download: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

evaluationSchema.plugin(any);
const HomeworkEvaluation = mongoose.model("homework_evaluation", evaluationSchema);
module.exports = HomeworkEvaluation;
