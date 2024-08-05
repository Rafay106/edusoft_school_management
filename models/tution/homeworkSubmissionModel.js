const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;
const required = [true, C.FIELD_IS_REQ];

const homeworkSubmissionSchema = new mongoose.Schema(
  {
    student: { type: ObjectId, required, ref: "students" },
    homework: { type: ObjectId, required, ref: "homeworks" },
    file: { type: String, required },
  },
  { timestamps: true, versionKey: false }
);

homeworkSubmissionSchema.plugin(any);

homeworkSubmissionSchema.pre("updateOne", async function (next) {
  this.setOptions({ runValidators: true });

  next();
});

homeworkSubmissionSchema.pre("updateMany", function (next) {
  this.setOptions({ runValidators: true });
  next();
});

const HomeworkSubmission = mongoose.model(
  "homework_submission",
  homeworkSubmissionSchema
);

module.exports = HomeworkSubmission;
