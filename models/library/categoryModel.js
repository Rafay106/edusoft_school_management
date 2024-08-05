const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const categorySchema = new mongoose.Schema(
  {
    title: { type: String, required, uppercase: true },
    // academic_year: { type: ObjectId, required, ref: "academic_years" },
    school: { type: ObjectId, required, ref: "schools" },
  },
  { timestamps: true, versionKey: false }
);

categorySchema.index({ title: 1, academic_year: 1 }, { unique: true });
categorySchema.plugin(any);

// Create Category Model
const LibraryCategory = mongoose.model("library_categories", categorySchema);
module.exports = LibraryCategory;
