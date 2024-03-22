const express = require("express");
const FC = require("../controllers/feeController");

const feeRouter = express.Router();

// 1. Academic Year Routes
const feeGroupRouter = express.Router();

feeGroupRouter.route("/").get(FC.getFeeGroups).post(FC.addFeeGroup);

feeGroupRouter
  .route("/:id")
  .get(FC.getFeeGroup)
  .patch(FC.updateFeeGroup)
  .delete(FC.deleteFeeGroup);

feeRouter.use("/fee-group", feeGroupRouter);

module.exports = feeRouter;
