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

const upload = (filePath) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        if (!fs.existsSync(filePath))
          fs.mkdirSync(filePath, { recursive: true });
        cb(null, filePath);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = req.user
          ? `${req.user._id}_${Date.now()}${ext}`
          : `${Date.now()}${ext}`;

        cb(null, name);
      },
    }),
  });
};

const photoUpload = (filePath, fileSize = maxSize) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        if (!fs.existsSync(filePath)) {
          fs.mkdirSync(filePath, { recursive: true });
        }
        cb(null, filePath);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${req.user._id}_${Date.now()}${ext}`);
      },
    }),
    limits: { fileSize },
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new Error("Only jpg, jpeg, or png files are allowed"));
      }
      cb(null, true);
    },
  });
};

const uploadExcel = (filePath) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        if (!fs.existsSync(filePath))
          fs.mkdirSync(filePath, { recursive: true });
        cb(null, filePath);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = req.user
          ? `${req.user._id}_${Date.now()}${ext}`
          : `${Date.now()}${ext}`;

        cb(null, name);
      },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
          return cb(new Error("Only xlsx/xls/csv files are supported!"));
        }
        cb(null, true);
      },
    }),
  });
};

module.exports = {
  memoryUpload,
  homeworkUpload,
  homeworkEvaluationUpload,
  upload,
  photoUpload,
  uploadExcel,
};
