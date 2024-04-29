const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.Schema.Types.ObjectId;

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
    },
    category: {
      type: ObjectId,
      ref: "library_categories",
      required: [true, C.FIELD_IS_REQ],
    },
    subject: {
      type: ObjectId,
      ref: "library_subjects", // Correct the 'refs' to 'ref' and provide the correct reference model name
      required: [true, C.FIELD_IS_REQ],
    },
    book_no: { type: String, required: [true, C.FIELD_IS_REQ] },
    ISBN_NO: { type: String, required: [true, C.FIELD_IS_REQ] },
    publisher_name: { type: String, default: " " },
    author_Name: {
      type: String,
    },
    rack_Number: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    book_Price: {
      type: Number,
      required: [true, C.FIELD_IS_REQ],
    },
    description: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
    },
    school: {
      type: ObjectId,
      ref: "users",
      required: [true, C.FIELD_IS_REQ],
    },
    academic_year: {
      type: ObjectId,
      required: [true, C.FIELD_IS_REQ],
      ref: "academic_years",
    },
  },
  {
    timestamps: true, // Move timestamps option outside the field definitions
  }
);
bookSchema.index(
  { title: 1, category: 1, subject: 1, school: 1 },
  { unique: true }
);

bookSchema.plugin(any);

const LibraryBook = mongoose.model("library_books", bookSchema);
module.exports = LibraryBook;
