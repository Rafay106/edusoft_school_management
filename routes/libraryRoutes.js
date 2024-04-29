const express = require("express");
const LC = require("../controllers/libraryController");

const libraryRouter = express.Router();

const categoryRouter = express.Router();

categoryRouter.route("/").get(LC.getCategories).post(LC.addCategory);
categoryRouter
  .route("/:id")
  .get(LC.getCategory)
  .patch(LC.updateCategory)
  .delete(LC.deleteCategory);

libraryRouter.use("/category", categoryRouter);

module.exports = libraryRouter;
