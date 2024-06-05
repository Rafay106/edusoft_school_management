const express = require("express");
const FC = require("../controllers/feeController");

const feeRouter = express.Router();

// 1. FeeGroup Routes
const feeGroupRouter = express.Router();

feeGroupRouter.route("/").get(FC.getFeeGroups).post(FC.addFeeGroup);

feeGroupRouter
  .route("/:id")
  .get(FC.getFeeGroup)
  .patch(FC.updateFeeGroup)
  .delete(FC.deleteFeeGroup);

// 2. FeeType Routes
const feeTypeRouter = express.Router();

feeTypeRouter.route("/").get(FC.getFeeTypes).post(FC.addFeeType);

feeTypeRouter
  .route("/:id")
  .get(FC.getFeeType)
  .patch(FC.updateFeeType)
  .delete(FC.deleteFeeType);

// 3. FeeTerm Routes
const feeTermRouter = express.Router();

feeTermRouter.route("/").get(FC.getFeeTerms).post(FC.addFeeTerm);

feeTermRouter
  .route("/:id")
  .get(FC.getFeeTerm)
  .patch(FC.updateFeeTerm)
  .delete(FC.deleteFeeTerm);

// 5. FeeStructure Routes
const feeStructureRouter = express.Router();

feeStructureRouter.route("/").get(FC.getFeeStructures).post(FC.addFeeStructure);

feeStructureRouter
  .route("/:id")
  .get(FC.getFeeStructure)
  .patch(FC.updateFeeStructure)
  .delete(FC.deleteFeeStructure);

// 6. FeeFine Routes
const feeFineRouter = express.Router();

feeFineRouter.route("/").get(FC.getFeeFines).post(FC.addFeeFine);

feeFineRouter
  .route("/:id")
  .get(FC.getFeeFine)
  .patch(FC.updateFeeFine)
  .delete(FC.deleteFeeFine);

// 7. FeeConcession Routes
const feeConcessionRouter = express.Router();

feeConcessionRouter
  .route("/")
  .get(FC.getFeeConcessions)
  .post(FC.addFeeConcession);

feeConcessionRouter
  .route("/:id")
  .get(FC.getFeeConcession)
  .patch(FC.updateFeeConcession)
  .delete(FC.deleteFeeConcession);

feeRouter.use("/fee-group", feeGroupRouter);
feeRouter.use("/fee-type", feeTypeRouter);
feeRouter.use("/fee-term", feeTermRouter);
feeRouter.use("/fee-structure", feeStructureRouter);
feeRouter.use("/fee-fine", feeFineRouter);
feeRouter.use("/fee-concession", feeConcessionRouter);
feeRouter.post("/calculate", FC.calculateFees);
feeRouter.post("/collect-fee", FC.collectFee);

module.exports = feeRouter;
