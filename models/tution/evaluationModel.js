const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const evaluationSchema = new mongoose.Schema(
  {
    student: { type: ObjectId, required, ref: "students" },
    homework: { type: ObjectId, required, ref: "homeworks" },
    marks: { type: Number, required },
    comments: { type: String, enum: ["g", "ng"], required },
    status: { type: String, enum: ["i", "c"], required }, // incomplete, complete
    file: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

evaluationSchema.plugin(any);

evaluationSchema.pre("updateOne", async function (next) {
  this.setOptions({ runValidators: true });

  next();
});

evaluationSchema.pre("updateMany", function (next) {
  this.setOptions({ runValidators: true });
  next();
});

const HomeworkEvaluation = mongoose.model(
  "homework_evaluation",
  evaluationSchema
);

module.exports = HomeworkEvaluation;
