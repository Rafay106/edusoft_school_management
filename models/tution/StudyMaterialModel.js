const mongoose = require("mongoose");
const C = require("../../constants");
const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];
const { any } = require("../../plugins/schemaPlugins");

const studyMaterialSchema = new mongoose.Schema(
  {
    teacher: { type: ObjectId, required, ref: "users" },
    class: { type: ObjectId, required, ref: "academics_classes" },
    section: { type: ObjectId, required, ref: "academics_sections" },
    document: { type: String, default: "" },
    content: { type: String, required },
    url: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
studyMaterialSchema.plugin(any);
studyMaterialSchema.pre("updateOne", async function (next) {
  this.setOptions({ runValidators: true });
  next();
});
studyMaterialSchema.pre("updateMany", async function (next) {
  this.setOptions({ runValidators: true });
  next();
});

const StudyMaterial = mongoose.model("study_material", studyMaterialSchema);
module.exports = StudyMaterial;
