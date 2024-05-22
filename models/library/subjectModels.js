const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const subjectSchema = new mongoose.Schema({
  name: { type: String, required, uppercase: true },
  category: { type: ObjectId, required, ref: "library_categories" },
  subject_code: { type: String, required },
  academic_year: { type: ObjectId, required, ref: "academic_years" },
  school: { type: ObjectId, required, ref: "schools" },
});

subjectSchema.index({ name: 1, category: 1, school: 1 }, { unique: true });
subjectSchema.plugin(any);

// Create Category Model
const LibrarySubject = mongoose.model("library_subjects", subjectSchema);
module.exports = LibrarySubject;
