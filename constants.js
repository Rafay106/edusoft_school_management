const STR = {
  ACCESS_DENIED: "Access Denied!",
  ACCOUNTANT: "accountant",
  ADMIN: "admin",
  A_ENTRY: "aEntry",
  A_EXIT: "aExit",
  BUS_STAFF: "bus-staff",
  CONDUCTOR: "conductor",
  CUSTOMVALIDATION: "CustomValidation",
  CUR_AYEAR_NOT_SET:
    "Current academic year not set, please set the current academic year!",
  DRIVER: "driver",
  EMAIL_QUEUE: "email_queue",
  FIELD_IS_INVALID: "%F% is invalid!",
  FIELD_IS_INVALID_AT_IDX: "%F% is invalid at row: %I%",
  FIELD_IS_REQ: "%F% is required!",
  FIELD_IS_REQ_AT_IDX: "%F% is required at row: %I%",
  INVALID_CREDENTIALS: "Invalid Credentials!",
  INVALID_ADMNO: "Invalid Admission Number!",
  LIBRARIAN: "librarian",
  MANAGER: "manager",
  M_ENTRY: "mEntry",
  M_EXIT: "mExit",
  PAGE_LIMIT_REACHED: "Page limit reached!",
  PARENT: "parent",
  PUSH_QUEUE: "push_queue",
  RECEPTIONIST: "receptionist",
  RESOURSE_404: "%R% not found",
  RESOURSE_404_ID: "%R% not found: %ID%",
  SCHOOL: "school",
  STAFF: "staff",
  STUDENT: "student",
  SUPERADMIN: "superadmin",
  TEACHER: "teacher",
  URL_404: "URL not found!",
  UNABLE_TO_DEL: "Unable to delete: %A% assigned to %B%!",
  UNKNOWN: "unknown",
  VALUE_NOT_SUP: "{VALUE} is not supported!",
  VALUE_NOT_SUP_AT_IDX: "%V% is not supported at row: %I%",
  WHATSAPP_QUEUE: "whatsapp_queue",
};

const FUNCTIONS = {
  getFieldIsInvalid: (field) => STR.FIELD_IS_INVALID.replace("%F%", field),
  getFieldIsInvalidAtIdx: (field, idx) =>
    STR.FIELD_IS_INVALID_AT_IDX.replace("%F%", field).replace("%I%", idx),
  getFieldIsReq: (field) => STR.FIELD_IS_REQ.replace("%F%", field),
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
  isAdmin: (type) => type === STR.ADMIN,
  isAdmins: (type) => [STR.SUPERADMIN, STR.ADMIN].includes(type),
  isManager: (type) => [STR.MANAGER].includes(type),
  isParent: (type) => [STR.PARENT].includes(type),
  isSchool: (type) => [STR.SCHOOL].includes(type),
  isSuperAdmin: (type) => type === STR.SUPERADMIN,
};

module.exports = { ...STR, ...FUNCTIONS };
