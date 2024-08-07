const STR = {
  ABSENT: "absent",
  ACCESS_DENIED: "Access Denied!",
  ACCOUNTANT: "accountant",
  ACTIVE: "active",
  ADMIN: "admin",
  ASSIGNED: "assigned",
  AFTERNOON_SHIFT: "afternoon_shift",
  ALTERNATE: "alternate",
  ATTENDANCE_BUS: "attendance-bus",
  ATTENDANCE_CLASS: "attendance-class",
  A_ENTRY: "aEntry",
  A_EXIT: "aExit",
  BUS: "bus",
  BUS_FEE: "BUS FEE",
  BUS_STAFF: "bus-staff",
  CASH: "CASH",
  CHEQUE_OR_DD: "CHEQUE_OR_DD",
  CONTINUOUS: "continuous",
  CONDUCTOR: "conductor",
  CUSTOM: "custom",
  CUSTOMVALIDATION: "CustomValidation",
  CUR_AYEAR_NOT_SET:
    "Current academic year not set, please set the current academic year!",
  CREDIT: "credit",
  DAILY: "daily",
  DB_BACKUP_TIME_LAST: "DB_BACKUP_TIME_LAST",
  DRIVER: "driver",
  DEBIT: "debit",
  EARLY: "early",
  EMAIL_QUEUE: "email_queue",
  ENTRY: "entry",
  EVENING_SHIFT: "evening shift",
  EXIT: "exit",
  EXPENSE: "expense",
  FEE: "fee",
  FEE_COLLECTION: "FEE_COLLECTION",
  FIELD_IS_INVALID: "%F% is invalid!",
  FIELD_IS_INVALID_AT_IDX: "%F% is invalid at row: %I%",
  FIELD_MISSING: "%F% is missing!",
  FIELD_IS_REQ: "is required!",
  FIELD_IS_REQ_: "%F% is required!",
  FIELD_IS_REQ_AT_IDX: "%F% is required at row: %I%",
  FLEXI_SHIFT: "flexi_shift",
  FIXED: "fixed",
  FLEXIBLE: "flexible",
  INCOME: "income",
  INVALID_CREDENTIALS: "Invalid Credentials!",
  INVALID_ADMNO: "Invalid Admission Number!",
  INACTIVE: "inactive",
  LATE: "late",
  LIBRARIAN: "librarian",
  MISC: "misc",
  MONTHLY: "monthly",
  MORNING_SHIFT: "morning_shift",
  M_ENTRY: "mEntry",
  M_EXIT: "mExit",
  NIGHT_SHIFT: "night_shift",
  NO: "no",
  NOTICE: "notice",
  ONE_TIME_FEES: "ONE_TIME_FEES",
  ONLINE: "ONLINE",
  OTHERS: "OTHERS",
  PAGE_LIMIT_REACHED: "Page limit reached!",
  PARENT: "parent",
  PARTIAL_FEES: "PARTIAL_FEES:",
  PENDING: "pending",
  POS_MACHINE: "pos_machine",
  PRESENT: "present",
  PUSH_QUEUE: "push_queue",
  RECEPTIONIST: "receptionist",
  RESOURSE_404: "%R% not found",
  RESOURSE_404_ID: "%R% not found: %ID%",
  SCHOOL: "school",
  STAFF: "staff",
  STUDENT: "student",
  SUPERADMIN: "superadmin",
  TEACHER: "teacher",
  TERM_FEES: "TERM_FEES:",
  TEST: "test",
  UNABLE_TO_DEL: "Unable to delete: %A% assigned to %B%!",
  UNASSIGNED: "unassigned",
  UNKNOWN: "unknown",
  URL_404: "URL not found!",
  VALUE_NOT_SUP: "'{VALUE}' is not supported!",
  VALUE_NOT_SUP_AT_IDX: "%V% is not supported at row: %I%",
  WEEKLY: "weekly",
  WHATSAPP_QUEUE: "whatsapp_queue",
  YES: "yes",
};

const FUNCTIONS = {
  getFieldIsInvalid: (field) => STR.FIELD_IS_INVALID.replace("%F%", field),
  getFieldIsInvalidAtIdx: (field, idx) =>
    STR.FIELD_IS_INVALID_AT_IDX.replace("%F%", field).replace("%I%", idx),
  getFieldMissing: (field) => STR.FIELD_MISSING.replace("%F%", field),
  getFieldIsReq: (field) => STR.FIELD_IS_REQ_.replace("%F%", field),
  getFieldIsReqAtIdx: (field, idx) =>
    STR.FIELD_IS_REQ_AT_IDX.replace("%F%", field).replace("%I%", idx),
  getResourse404: (resource) => STR.RESOURSE_404.replace("%R%", resource),
  getResourse404Id: (resource, id) =>
    STR.RESOURSE_404_ID.replace("%R%", resource).replace("%ID%", id),
  getUnableToDel: (a, b) =>
    STR.UNABLE_TO_DEL.replace("%A%", a).replace("%B%", b),
  getValueNotSup: (val) => STR.VALUE_NOT_SUP.replace("{VALUE}", val),
  getValueNotSupAtIdx: (val, idx) =>
    STR.VALUE_NOT_SUP_AT_IDX.replace("%V%", val).replace("%I%", idx),
};

module.exports = { ...STR, ...FUNCTIONS };
