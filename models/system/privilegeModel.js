const mongoose = require("mongoose");
const C = require("../../constants");

const schema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, C.FIELD_IS_REQ],
    enum: {
      values: [
        C.SUPERADMIN,
        C.ADMIN,
        C.MANAGER,
        C.SCHOOL,
        C.ACCOUNTANT,
        C.BUS_STAFF,
        C.LIBRARIAN,
        C.PARENT,
        C.RECEPTIONIST,
      ],
      message: C.VALUE_NOT_SUP,
    },
  },
  privileges: {
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
      addmission_query: {
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
    download_center: {},
    study_material: {},
    lesson_plan: {},
    fees_settings: {},
    exam_settings: {},
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
    user: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    school: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    busStaff: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    busStop: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    bus: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    student: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    util: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },
});

schema.index({ type: 1 }, { unique: true });

const Privilege = mongoose.model("privileges", schema);
module.exports = Privilege;
