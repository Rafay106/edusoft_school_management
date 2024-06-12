const mongoose = require("mongoose");
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const leaveStaffApplySchema = new mongoose.Schema({
      type:{type:String,required,enum:["c","F","E"]}, // "casual","formal","emergency"
      school:{type:ObjectId,required,ref:"schools"},
      l_from:{type:Date,required},
      l_to:{type:Date,required},
      reason:{type:String,required},
      file:{type:String,default:""},
},{
    timestamps:true,
    versionKey:false
});
leaveStaffApplySchema.plugin(any);

const leaveStaffApply  = mongoose.Model("leave_staff_apply",leaveStaffApplySchema);
module.exports = leaveStaffApply;

