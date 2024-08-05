const mongoose = require("mongoose");
const {any} = require("../../plugins/schemaPlugins");
const C = require("../../constants");
const required = [true,C.FIELD_IS_REQ];
const ObjectId = mongoose.SchemaTypes.ObjectId;
const approveLeaveStudentSchema = new mongoose.Schema({
       name:{type:String,required,uppercase:true},
       leave_apply:{type:ObjectId,required,ref:"leave_student_apply"},
       status:{type:String,required,enum:["conf","pend","canc"]} //"confirmed","pending","cancelled"
},
{
   timestamps:true,
   versionKey:false    
});
approveLeaveStudentSchema.plugin(any);
const ApproveLeaveStudentSchema  = mongoose.model("approve_leave_student",approveLeaveStudentSchema);
module.exports = ApproveLeaveStudentSchema;