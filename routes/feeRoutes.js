const express = require("express");
const FC = require("../controllers/feeController");

const feeRouter = express.Router();

// 1. Fee Group Routes
const feeGroupRouter = express.Router();

feeGroupRouter.route("/").get(FC.getFeeGroups).post(FC.addFeeGroup);

feeGroupRouter
  .route("/:id")
  .get(FC.getFeeGroup)
  .patch(FC.updateFeeGroup)
  .delete(FC.deleteFeeGroup);

// 2. Fee Type Routes
const feeTypeRouter = express.Router();

feeTypeRouter.route("/").get(FC.getFeeTypes).post(FC.addFeeType);

feeTypeRouter
  .route("/:id")
  .get(FC.getFeeType)
  .patch(FC.updateFeeType)
  .delete(FC.deleteFeeType);

// 3. Fee Type Routes
const feeTermRouter = express.Router();

feeTermRouter.route("/").get(FC.getFeeTerms).post(FC.addFeeTerm);

feeTermRouter
  .route("/:id")
  .get(FC.getFeeTerm)
  .patch(FC.updateFeeTerm)
  .delete(FC.deleteFeeTerm);

// 4. Fee Head Routes
const feeHeadRouter = express.Router();

feeHeadRouter.route("/").get(FC.getFeeHeads).post(FC.addFeeHead);

feeHeadRouter
  .route("/:id")
  .get(FC.getFeeHead)
  .patch(FC.updateFeeHead)
  .delete(FC.deleteFeeHead);

// 5. Fee Structure Routes
const feeStructureRouter = express.Router();

feeStructureRouter.route("/").get(FC.getFeeStructures).post(FC.addFeeStructure);

feeStructureRouter
  .route("/:id")
  .get(FC.getFeeStructure)
  .patch(FC.updateFeeStructure)
  .delete(FC.deleteFeeStructure);

feeRouter.use("/fee-group", feeGroupRouter);
feeRouter.use("/fee-type", feeTypeRouter);
feeRouter.use("/fee-term", feeTermRouter);
feeRouter.use("/fee-head", feeHeadRouter);
feeRouter.use("/fee-structure", feeStructureRouter);

module.exports = feeRouter;
