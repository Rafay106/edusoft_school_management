const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.Schema.Types.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const homeWorkSchema = new mongoose.Schema(
  {
    class: { type: ObjectId, required, ref: "academics_classes" },
    subject: { type: ObjectId, required, ref: "academics_subjects" },
    section: { type: ObjectId, required, ref: "academics_sections" },
    homework_date: { type: Date, required },
    submission_date: { type: Date, required },
    evaluation_date: { type: Date, default: 0 },
    marks: { type: Number, required },
    doc_file: { type: String, default: "" },
    description: { type: String, required },
    created_by: { type: ObjectId, required, ref: "users" },
    academic_year: { type: ObjectId, required, ref: "academic_years" },
  },
  { timestamps: true, versionKey: false }
);

homeWorkSchema.plugin(any);
homeWorkSchema.pre("updateOne", async function (next) {
  this.setOptions({ runValidators: true });
  next();
});
homeWorkSchema.pre("updateMany", async function (next) {
  this.setOptions({ runValidators: true });
  next();
});

const Homework = mongoose.model("homeworks", homeWorkSchema);

module.exports = Homework;
