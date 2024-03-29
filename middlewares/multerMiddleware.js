const multer = require("multer");
const fs = require("node:fs");
const path = require("node:path");

const mimeTypes = {
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
  "image/png": "png",
};

const memoryUpload = multer({
  storage: multer.memoryStorage(),
});

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
});

const maxSize = 2 * 1024 * 1024; // 2MB

const busStaffPhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const filePath = path.join("uploads", "bus_staff");
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
      const filePath = path.join("uploads", "student");
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

const staffUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const filePath = path.join("uploads", "staff");
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
  upload,
  memoryUpload,
  busStaffPhotoUpload,
  studentPhotoUpload,
  studentBulkImportUpload,
  staffUpload,
};
