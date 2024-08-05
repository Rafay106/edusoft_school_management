const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const C = require("../../constants");
const { any } = require("../../plugins/schemaPlugins");
const required = [true, C.FIELD_IS_REQ];

const leavePoliciesSchema = new mongoose.Schema({
       type:{type:String,required,enum:{
           values:["casual","earned","sick"],message:C.VALUE_NOT_SUP
       }},
       total_days:{type:Number,required,default:365},
       no_of_sundays:{type:Number,required},
       no_of_festivals:{type:String,required,},
       // working days = total_days-(no_of_sundays+no_of_festivals)
       earned:{
           no_of_earned:{type:Number,required},
           maternity_leave:{type:Number,default:0},
           paternity_leave:{type:Number,default:0},
           marriage_leave:{type:Number,required},
           no_of_days_inform_before:{type:Number,required},
           reason:{type:String,required}
        },
      casual:{
          no_of_casual:{type:Number,required},
          reason:{type:String,required},
          no_of_days_inform_before:{type:Number,default:0},  // 1 to 3 days
          reason:{type:String,required}
          },
      sick:{
           no_of_sick:{type:Number,required,},
           reason:{type:String,required},
           document:{type:String,default:""}
      }
    },
{ timestamps: true,versionKey: false}
)
const LeavePolicies =  mongoose.Model("hr_leave_policies",leavePoliciesSchema);
module.exports = LeavePolicies;

