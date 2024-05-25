const multer = require("multer");
const fs = require("node:fs");
const path = require("node:path");

const maxSize = 2 * 1024 * 1024; // 2MB
const mimeTypes = {
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
  "image/png": "png",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const memoryUpload = multer({
  storage: multer.memoryStorage(),
});

const busStaffPhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const filePath = path.join("static", "uploads", "bus_staff");
      if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
      cb(null, filePath);
    },
    filename: (req, file, cb) => {
      const ext = mimeTypes[file.mimetype];
      cb(null, `${req.user._id}_${Date.now()}.${ext}`);
    },
  }),
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Only jpg, jpeg, or png files are allowed"));
    }
    cb(null, true);
  },
});

const studentPhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const filePath = path.join("static", "uploads", "student");
      if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
      cb(null, filePath);
    },
    filename: (req, file, cb) => {
      const ext = mimeTypes[file.mimetype];
      cb(null, `${req.user._id}_${Date.now()}.${ext}`);
    },
  }),
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Only jpg, jpeg, or png files are allowed"));
    }
    cb(null, true);
  },
});

const studentBulkImportUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const filePath = path.join("imports", "student");
      if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
      cb(null, filePath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);

      if (![".xlsx"].includes(ext)) {
        return cb(new Error("Only xlsx files supported!"));
      }

      cb(null, `${Date.now()}${ext}`);
    },
  }),
});

const bulkImportUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const filePath = path.join("data", "imports");
      if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
      cb(null, filePath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);

      if (![".xlsx"].includes(ext)) {
        return cb(new Error("Only xlsx files supported!"));
      }

      cb(null, `${Date.now()}${ext}`);
    },
  }),
});

const staffUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const filePath = path.join("static", "uploads", "staff");
      if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
      cb(null, filePath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user._id}_${Date.now()}${ext}`);
    },
  }),
});

const idCardUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const filePath = path.join(
        "static",
        "uploads",
        "admin_system",
        "id_card"
      );
      if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
      cb(null, filePath);
    },
    filename: (req, file, cb) => {
      const ext = mimeTypes[file.mimetype];
      cb(null, `${req.user._id}_${file.fieldname}_${Date.now()}.${ext}`);
    },
  }),
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Only jpg, jpeg, or png files are allowed"));
    }
    cb(null, true);
  },
});

const homeworkUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const filePath = path.join("static", "uploads", "homework");
      if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
      cb(null, filePath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user._id}_${Date.now()}${ext}`);
    },
  }),
});

const homeworkEvaluationUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const filePath = path.join("static", "uploads", "homework");
      if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
      cb(null, filePath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user._id}_${Date.now()}${ext}`);
    },
  }),
});

module.exports = {
  memoryUpload,
  busStaffPhotoUpload,
  studentPhotoUpload,
  studentBulkImportUpload,
  bulkImportUpload,
  staffUpload,
  idCardUpload,
  homeworkUpload,
  homeworkEvaluationUpload,
};
