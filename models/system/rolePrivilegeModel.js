const mongoose = require("mongoose");
const { any } = require("../../plugins/schemaPlugins");
const C = require("../../constants");

const ObjectId = mongoose.SchemaTypes.ObjectId;
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
    role: crud,
    role_privilege: crud,
    user: crud,
    school: { ...crud, update_cash: { type: Boolean, default: false } },
    whatsapp_coin: { enabled: { type: Boolean, default: false } },
    device: crud,
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
    },
    attendance: {
      enabled: { type: Boolean, default: false },
      bus: { type: Boolean, default: false },
      bus_stats: { type: Boolean, default: false },
      class: { type: Boolean, default: false },
      class_stats: { type: Boolean, default: false },
    },
    notification: { enabled: { type: Boolean, default: false } },
  },
  transport: {
    enabled: { type: Boolean, default: false },
    bus_staff: { ...crud, bulk_ops: { type: Boolean, default: false } },
    bus_stop: { ...crud, bulk_ops: { type: Boolean, default: false } },
    bus: {
      ...crud,
      bulk_ops: { type: Boolean, default: false },
      set_unset_alternate: { type: Boolean, default: false },
      track: { type: Boolean, default: false },
      bus_status: { type: Boolean, default: false },
      switch_bus: { type: Boolean, default: false },
    },
  },
  teacher: { enabled: { type: Boolean, default: false } },
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
  parent: {
    enabled: { type: Boolean, default: false },
    bus: {
      enabled: { type: Boolean, default: false },
      track: { type: Boolean, default: false },
      contact_info: { type: Boolean, default: false },
    },
    fee: {
      enabled: { type: Boolean, default: false },
      calculate_fee: { type: Boolean, default: false },
      pay_fee: { type: Boolean, default: false },
    },
    attendance: {
      enabled: { type: Boolean, default: false },
      bus: { type: Boolean, default: false },
      class: { type: Boolean, default: false },
    },
  },
  dashboard: { enabled: { type: Boolean, default: false } },
  library: {
    enabled: { type: Boolean, default: false },
    category: crud,
    subject: crud,
    book: crud,
    book_issued: crud,
  },
  homework: { ...crud, evaluation: crud },
  lesson_schedule: {
    enabled: { type: Boolean, default: false },
    lesson: crud,
    topic: crud,
  },
  communication: {
    enabled: { type: Boolean, default: false },
    noticeboard: { ...crud, bulk_ops: { type: Boolean, default: false } },
    send_message: { enabled: { type: Boolean, default: false } },
  },
  examination: {
    enabled: { type: Boolean, default: false },
  },
  account: {
    enabled: { type: Boolean, default: false },
    bank: crud,
    chart: crud,
  },
  api_key: { enabled: { type: Boolean, default: false } },
};

const schema = new mongoose.Schema(
  {
    role: { type: ObjectId, required, ref: "system_roles" },
    privileges,
  },
  { timestamps: true, versionKey: false, minimize: false }
);

schema.index({ role: 1 }, { unique: true });

schema.plugin(any);

const RolePrivilege = mongoose.model("system_role_privileges", schema);
module.exports = RolePrivilege;
