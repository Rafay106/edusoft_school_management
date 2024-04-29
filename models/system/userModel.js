const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const C = require("../../constants");
const { isEmailValid, isUsernameValid } = require("../../utils/validators");
const { any } = require("../../plugins/schemaPlugins");

const ObjectId = mongoose.SchemaTypes.ObjectId;

const privilegesSchema = new mongoose.Schema({
  sidebar_manager: { type: Boolean, default: false },
  dashboard: {
    no_of_students: { type: Boolean, default: false },
    no_of_teacher: { type: Boolean, default: false },
    no_of_parents: { type: Boolean, default: false },
    no_of_staff: { type: Boolean, default: false },
    cmiaec: { type: Boolean, default: false }, // Current Month Income And Expenses Chart
    cyiaec: { type: Boolean, default: false }, // Current Year Income And Expenses Chart
    notice_board: { type: Boolean, default: false },
    calender_section: { type: Boolean, default: false },
    to_do_list: { type: Boolean, default: false },
  },
  admin_section: {
    admission_query: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    visitor_book: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      download: { type: Boolean, default: false },
    },
    complaint: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      download: { type: Boolean, default: false },
    },
    postal_receive: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      download: { type: Boolean, default: false },
    },
    postal_dispatch: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      download: { type: Boolean, default: false },
    },
    phone_call_log: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    admin_setup: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    student_id_card: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    generate_certificate: { type: Boolean, default: false },
    generate_id_card: { type: Boolean, default: false },
  },
  sutdent_info: {
    category: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    add: { type: Boolean, default: false },
    list: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      assign_class: { type: Boolean, default: false },
      show_all: { type: Boolean, default: false },
    },
    multi_class: { type: Boolean, default: false },
    delete_record: { type: Boolean, default: false },
    unassign: { type: Boolean, default: false },
    attendance: { add: { type: Boolean, default: false } },
    group: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    promote: { add: { type: Boolean, default: false } },
    disabled: {
      search: { type: Boolean, default: false },
      enable: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    subject_wise_attendance: { save: { type: Boolean, default: false } },
    export: {
      to_csv: { type: Boolean, default: false },
      to_pdf: { type: Boolean, default: false },
    },
    time_setup: { type: Boolean, default: false },
  },
  academics: {
    optional_subject: { type: Boolean, default: false },
    section: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    class: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    subjects: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    assign_class_teacher: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    assign_subject: {
      add: { type: Boolean, default: false },
      view: { type: Boolean, default: false },
    },
    class_room: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    class_routine: {
      add: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    teacher_class_routine: { type: Boolean, default: false },
  },
  download_center: {
    content_type: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    content_list: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      search: { type: Boolean, default: false },
    },
    shared_content_list: {
      add: { type: Boolean, default: false },
      generate_link: { type: Boolean, default: false },
    },
    video_list: {
      add: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      search: { type: Boolean, default: false },
    },
  },
  study_material: {
    upload_content: {
      add: { type: Boolean, default: false },
      download: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
    },
    assignment: {
      edit: { type: Boolean, default: false },
      download: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    syllabus: {
      edit: { type: Boolean, default: false },
      download: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    other_downloads: {
      download: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
    },
  },
  lesson_plan: {
    lesson: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    topic: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    topic_overview: { type: Boolean, default: false },
    lesson_plan: {
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      view: { type: Boolean, default: false },
    },
    my_lesson_plan: { type: Boolean, default: false },
    my_lesson_plan_overview: { type: Boolean, default: false },
    lesson_plan_overview: { type: Boolean, default: false },
  },
  fees_settings: {
    fee_invoic_settings: {
      update: { type: Boolean, default: false },
    },
  },
  exam_settings: {
    format_settings: { type: Boolean, default: false },
    setup_exam_rule: { type: Boolean, default: false },
    position_setup: { type: Boolean, default: false },
    all_exam_position: { type: Boolean, default: false },
    exam_signature_settings: { type: Boolean, default: false },
    admit_card_setting: { type: Boolean, default: false },
    seat_plan_setting: { type: Boolean, default: false },
  },
  student_report: {},
  exam_report: {},
  staff_report: {},
  fees_report: {},
  accounts_report: {},
  fees: {},
  wallet: {},
  bulk_print: {},
  accounts: {},
  human_resource: {},
  leave: {},
  teacher_evaluation: {},
  custom_field: {},
  chat: {},
  examination: {},
  exam_plan: {},
  online_exam: {},
  behaviour_records: {},
  homework: {},
  communicate: {},
  library: {},
  inventory: {},
  transport: {},
  dormitory: {},
  role_and_permissions: {},
  general_settings: {},
  style: {},
  frontend_cms: {},
});

const schema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      validate: {
        validator: isEmailValid,
        message: (props) => `email: ${props.value} is invalid!`,
      },
      lowercase: true,
      trim: true,
    },
    email_verified: { type: Boolean, default: false },
    password: { type: String, required: [true, C.FIELD_IS_REQ] },
    name: { type: String, required: [true, C.FIELD_IS_REQ] },
    phone: { type: String, required: [true, C.FIELD_IS_REQ] },
    phone_verified: { type: Boolean, default: false },
    type: {
      type: String,
      required: [true, C.FIELD_IS_REQ],
      enum: {
        values: [
          C.SUPERADMIN,
          C.ADMIN,
          C.MANAGER,
          C.SCHOOL,
          C.TEACHER,
          C.PARENT,
          C.STUDENT,
          C.ACCOUNTANT,
          C.BUS_STAFF,
          C.LIBRARIAN,
          C.RECEPTIONIST,
        ],
        message: C.VALUE_NOT_SUP,
      },
    },
    privileges: { type: privilegesSchema, required: [true, C.FIELD_IS_REQ] },
    school_limit: { type: Number, default: 0 },
    school: { type: ObjectId, ref: "schools" },
    manager: { type: ObjectId, ref: "users" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ email: 1 }, { unique: true });
schema.index({ phone: 1 }, { unique: true });
// schema.index({ username: 1 }, { unique: true });

schema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (this.type === C.SCHOOL) {
    if (!this.manager) {
      throw new Error("manager is required!");
    }
  }

  next();
});

schema.pre("updateOne", function (next) {
  this.setOptions({ runValidators: true });

  const emailToUpdate = this.getUpdate().$set?.email;
  if (emailToUpdate) {
    this.updateOne({}, { $set: { email_verified: false } });
  }

  const phoneToUpdate = this.getUpdate().$set?.phone;
  if (phoneToUpdate) {
    this.updateOne({}, { $set: { phone_verified: false } });
  }

  next();
});

schema.pre("updateMany", function (next) {
  this.setOptions({ runValidators: true });

  const emailToUpdate = this.getUpdate().$set?.email;
  if (emailToUpdate) {
    this.updateOne({}, { $set: { email_verified: false } });
  }

  const phoneToUpdate = this.getUpdate().$set?.phone;
  if (phoneToUpdate) {
    this.updateOne({}, { $set: { phone_verified: false } });
  }

  next();
});

schema.plugin(any);

const User = mongoose.model("users", schema);
module.exports = User;
