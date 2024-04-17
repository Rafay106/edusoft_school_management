const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const categorySchema = new mongoose.Schema({
  title: { type: String, required: [true, C.FIELD_IS_REQ], uppercase: true },
  academic_year: {
    type: ObjectId,
    required: [true, C.FIELD_IS_REQ],
    ref: "academic_years",
  },
  school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
});

categorySchema.index({ title: 1, school: 1 }, { unique: true });
categorySchema.plugin(any);

// Create Category Model
const LibraryCategory = mongoose.model("library_categories", categorySchema);
module.exports = LibraryCategory;
