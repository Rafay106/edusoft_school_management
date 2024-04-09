const STR = {
  ACCOUNTANT: "accountant",
  ADMIN: "admin",
  A_ENTRY: "aEntry",
  A_EXIT: "aExit",
  BUS_STAFF: "bus-staff",
  CONDUCTOR: "conductor",
  CUSTOMVALIDATION: "CustomValidation",
  DRIVER: "driver",
  FIELD_IS_INVALID: "%F% is invalid!",
  FIELD_IS_INVALID_AT_IDX: "%F% is invalid at index: %I%",
  FIELD_IS_REQ: "%F% is required!",
  FIELD_IS_REQ_AT_IDX: "%F% is required at index: %I%",
  INVALID_CREDENTIALS: "Invalid Credentials!",
  LIBRARIAN: "librarian",
  MANAGER: "manager",
  M_ENTRY: "mEntry",
  M_EXIT: "mExit",
  PAGE_LIMIT_REACHED: "Page limit reached!",
  PARENT: "parent",
  RECEPTIONIST: "receptionist",
  RESOURSE_404: "%R% not found: %ID%",
  SCHOOL: "school",
  STUDENT: "student",
  SUPERADMIN: "superadmin",
  TEACHER: "teacher",
  URL_404: "URL not found!",
  UNABLE_TO_DEL: "Unable to delete: %A% assigned to %B%!",
  UNKNOWN: "unknown",
  VALUE_NOT_SUP: "{VALUE} is not supported!",
  VALUE_NOT_SUP_AT_IDX: "%V% is not supported at index: %I%",
};

const FUNCTIONS = {
  getFieldIsInvalid: (field) => STR.FIELD_IS_INVALID.replace("%F%", field),
  getFieldIsInvalidAtIdx: (field, idx) =>
    STR.FIELD_IS_INVALID_AT_IDX.replace("%F%", field).replace("%I%", idx),
  getFieldIsReq: (field) => STR.FIELD_IS_REQ.replace("%F%", field),
  getFieldIsReqAtIdx: (field, idx) =>
    STR.FIELD_IS_REQ_AT_IDX.replace("%F%", field).replace("%I%", idx),
  getResourse404Error: (resource, id) =>
    STR.RESOURSE_404.replace("%R%", resource).replace("%ID%", id),
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
