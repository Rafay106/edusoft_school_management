const express = require("express");
const AC = require("../controllers/accountController");

const accountRouter = express.Router();

// 1. Bank Routes
const bankRouter = express.Router();

bankRouter.route("/").get(AC.getBanks).post(AC.addBank);
bankRouter
  .route("/:id")
  .get(AC.getBank)
  .patch(AC.updateBank)
  .delete(AC.deleteBank);

// 2. Chart Routes
const chartRouter = express.Router();

chartRouter.route("/").get(AC.getCharts).post(AC.addChart);
chartRouter
  .route("/:id")
  .get(AC.getChart)
  .patch(AC.updateChart)
  .delete(AC.deleteChart);

// 3. Chart Routes
const ledgerRouter = express.Router();

ledgerRouter.route("/").get(AC.getLedger);

accountRouter.use("/bank", bankRouter);
accountRouter.use("/chart", chartRouter);
accountRouter.use("/ledger", ledgerRouter);

module.exports = accountRouter;
