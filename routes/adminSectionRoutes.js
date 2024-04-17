const express = require("express");
const C = require("../controllers/adminSectionController");
const { idCardUpload } = require("../middlewares/multerMiddleware");

const adminSectionRouter = express.Router();

const idCardRouter = express.Router();

idCardRouter
  .route("/")
  .get(C.getIdCards)
  .post(
    idCardUpload.fields([
      { name: "background", maxCount: 1 },
      { name: "photo", maxCount: 1 },
      { name: "logo", maxCount: 1 },
      { name: "signature", maxCount: 1 },
    ]),
    C.createIdCard
  );
idCardRouter.post("/student", C.genStudentIdCard);
idCardRouter
  .route("/:id")
  .get(C.getIdCard)
  .patch(
    idCardUpload.fields([
      { name: "background", maxCount: 1 },
      { name: "photo", maxCount: 1 },
      { name: "logo", maxCount: 1 },
      { name: "signature", maxCount: 1 },
    ]),
    C.updateIdCard
  )
  .delete(C.deleteIdCard);

adminSectionRouter.use("/id-card", idCardRouter);

module.exports = adminSectionRouter;
