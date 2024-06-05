const mongoose = require("mongoose");
const C = require("../../constants");

const required = [true, C.FIELD_IS_REQ];

const crud = {
  enabled: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
};

const privileges = {
  system: {
    enabled: { type: Boolean, default: false },
    privilege_template: crud,
    user: crud,
    school: crud,
    whatsapp_coin: { enabled: { type: Boolean, default: false } },
  },
  util: { enabled: { type: Boolean, default: false } },
  admin_section: {
    enabled: { type: Boolean, default: false },
    id_card: { enabled: { type: Boolean, default: false } },
  },
  academics: {
    enabled: { type: Boolean, default: false },
    academic_year: crud,
    section: crud,
    stream: crud,
    class: crud,
    subject: crud,
    class_routine: crud,
  },
  student_info: {
    enabled: { type: Boolean, default: false },
    boarding_type: crud,
    subward: crud,
    student: {
      ...crud,
      bulk_ops: { type: Boolean, default: false },
      attendance: { type: Boolean, default: false },
    },
  },
  transport: {
    enabled: { type: Boolean, default: false },
    bus_staff: crud,
    bus_stop: { ...crud, bulk_ops: { type: Boolean, default: false } },
    bus: {
      ...crud,
      bulk_ops: { type: Boolean, default: false },
      set_unset_alternate: { type: Boolean, default: false },
      track: { type: Boolean, default: false },
      bus_status: { type: Boolean, default: false },
    },
  },
  fee: {
    enabled: { type: Boolean, default: false },
    fee_group: crud,
    fee_type: crud,
    fee_term: crud,
    fee_concession: crud,
    fee_fine: crud,
    fee_structure: crud,
    calculate_fee: { type: Boolean, default: false },
    collect_fee: { type: Boolean, default: false },
  },
  hr: {
    enabled: { type: Boolean, default: false },
    department: crud,
    designation: crud,
    staff: crud,
  },
  parent_util: { enabled: { type: Boolean, default: false } },
  parent: { enabled: { type: Boolean, default: false } },
  dashboard: { enabled: { type: Boolean, default: false } },
  library: {
    enabled: { type: Boolean, default: false },
    category: crud,
    subject: crud,
    book: crud,
    book_issued: crud,
  },
  homework: { ...crud, evaluation: crud },
  lesson_plan: {
    enabled: { type: Boolean, default: false },
    lesson: crud,
    topic: crud,
  },
  communication: {
    enabled: { type: Boolean, default: false },
    noticeboard: { ...crud, bulk_ops: { type: Boolean, default: false } },
    send_message: { enabled: { type: Boolean, default: false } },
  },
  api_key: { enabled: { type: Boolean, default: false } },
};

const schema = new mongoose.Schema(
  {
    type: {
      type: String,
      required,
      enum: {
        values: [
          C.SUPERADMIN,
          C.ADMIN,
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
    privileges,
  },
  { versionKey: false, minimize: false }
);

schema.index({ type: 1 }, { unique: true });

const TemplatePrivilege = mongoose.model("template_privileges", schema);

module.exports = { TemplatePrivilege, privileges };
