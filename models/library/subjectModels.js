const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");


const ObjectId = mongoose.SchemaTypes.ObjectId;

const subjectSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,C.FIELD_IS_REQ]
 },
//  category title that reference categoryModels in library folder
  category: { type: ObjectId,
           ref: "library_categories"
           
           
          
  },
  academic_year: {
    type: ObjectId,
    required: [true, C.FIELD_IS_REQ],
    ref: "academic_years",
  },
  school: { type: ObjectId, required: [true, C.FIELD_IS_REQ], ref: "users" },
  subjectCode:{
       type :String,
       required:[true,C.FIELD_IS_REQ]
  }
});

 subjectSchema.index({name : 1, category: 1, school: 1 }, { unique: true });
subjectSchema.plugin(any);

// Create Category Model
const LibrarySubject = mongoose.model("library_subjects", subjectSchema);
module.exports = LibrarySubject;
