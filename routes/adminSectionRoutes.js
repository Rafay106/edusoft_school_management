const express = require("express");
const C = require("../controllers/adminSectionController");

const adminSectionRouter = express.Router();

const idCardRouter = express.Router();

idCardRouter.post("/student", C.genStudentIdCard);
idCardRouter.post("/student/all", C.genStudentIdCardAll);

const idCardGeneratedRouter = express.Router();

idCardGeneratedRouter
  .route("/")
  .get(C.getGeneratedIdCards)
  .delete(C.deleteGeneratedIdCard);
idCardGeneratedRouter.delete("/all", C.deleteAllGeneratedIdCard);

adminSectionRouter.use("/id-card", idCardRouter);
adminSectionRouter.use("/id-card-generated", idCardGeneratedRouter);

module.exports = adminSectionRouter;
