const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const issueBookSchema = new mongoose.Schema({
  book: {
    type: ObjectId,
    ref: "library_books",
    required: [true, C.FIELD_IS_REQ],
  },
  student: { type: ObjectId, ref: "students" },
  staff: { type: ObjectId, ref: "staffs" },
  issued_date: { type: Date, required: [true, C.FIELD_IS_REQ] },
  return_date: { type: Date, default: 0 },
  status: {
    type: String,
    required: [true, C.FIELD_IS_REQ],
    enum: ["issued", "returned"],
  },
  academic_year: {
    type: ObjectId,
    required: [true, C.FIELD_IS_REQ],
    ref: "academic_years",
  },
  school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
});

issueBookSchema.plugin(any);

const LibraryIssueBook = mongoose.model("library_issue_book", issueBookSchema);

module.exports = LibraryIssueBook;
