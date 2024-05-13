const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const ObjectId = mongoose.Schema.Types.ObjectId;

const homeWorkSchema = new mongoose.Schema(
  {
    class: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "classes",
    },
    subject: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "subjects",
    },
    section: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "sections",
    },
    homework_date: { type: Date, required: [true, C.FIELD_IS_REQ] },
    submission_date: { type: Date, required: [true, C.FIELD_IS_REQ] },
    evaluation_date: { type: Date, default: 0 },
    marks: { type: Number, required: [true, C.FIELD_IS_REQ] },
    doc_file: { type: String, default: "" },
    description: { type: String, required: [true, C.FIELD_IS_REQ] },
    school: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "schools",
    },
    academic_year: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "academic_years",
    },
  },
  { timestamps: true, versionKey: false }
);

homeWorkSchema.plugin(any);

const homeWork = mongoose.model("homeWorks", homeWorkSchema);

module.exports = homeWork;
