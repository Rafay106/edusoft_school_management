const fs = require("node:fs");
const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Bank = require("../models/account/bankModel");
const Chart = require("../models/account/chartModel");
const Ledger = require("../models/account/ledgerModel");

/** 1. Bank */

// @desc    Get  banks
// @route   GET /api/account/bank
// @access  Private
const getBanks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "bank_name";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = [
      "bank_name",
      "account_holder",
      "account_no",
      "account_type",
      "ifsc",
    ];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(Bank, query, "", page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a bank
// @route   GET /api/account/bank/:id
// @access  Private
const getBank = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const bank = await Bank.findOne(query).lean();

  if (!bank) {
    res.status(404);
    throw new Error(C.getResourse404("Bank"));
  }

  res.status(200).json(bank);
});

// @desc    Add a bank
// @route   POST /api/account/bank
// @access  Private
const addBank = asyncHandler(async (req, res) => {
  const bank = await Bank.create({
    bank_name: req.body.bank_name,
    account_holder: req.body.account_holder,
    account_no: req.body.account_no,
    account_type: req.body.account_type,
    ifsc: req.body.ifsc,
    balance: req.body.opening_balance,
  });

  res.status(201).json({ msg: bank._id });
});

// @desc    Update a bank
// @route   PATCH /api/account/bank/:id
// @access  Private
const updateBank = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const result = await Bank.updateOne(query, {
    $set: {
      bank_name: req.body.bank_name,
      account_holder: req.body.account_holder,
      account_no: req.body.account_no,
      account_type: req.body.account_type,
      ifsc: req.body.ifsc,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a bank
// @route   DELETE /api/account/bank/:id
// @access  Private
const deleteBank = asyncHandler(async (req, res) => {
  const bank = await Bank.findById(req.params.id).select("_id").lean();

  if (!bank) {
    res.status(400);
    throw new Error(C.getResourse404Id("Bank", req.params.id));
  }

  if (await LedgerType.any({ bank: bank._id })) {
    res.status(402);
    throw new Error(C.getUnableToDel("Bank", "LedgerType"));
  }

  const result = await Bank.deleteOne({ _id: req.params.id });

  res.status(200).json(result);
});

/** 2. Chart */

// @desc    Get  charts
// @route   GET /api/account/chart
// @access  Private
const getCharts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "head";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["head", "type"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(Chart, query, "", page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a chart
// @route   GET /api/account/chart/:id
// @access  Private
const getChart = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const chart = await Chart.findOne(query).lean();

  if (!chart) {
    res.status(404);
    throw new Error(C.getResourse404("Chart"));
  }

  res.status(200).json(chart);
});

// @desc    Add a chart
// @route   POST /api/account/chart
// @access  Private
const addChart = asyncHandler(async (req, res) => {
  const chart = await Chart.create({
    head: req.body.head,
    type: req.body.type,
  });

  res.status(201).json({ msg: chart._id });
});

// @desc    Update a chart
// @route   PATCH /api/account/chart/:id
// @access  Private
const updateChart = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const result = await Chart.updateOne(query, {
    $set: { head: req.body.head, type: req.body.type },
  });

  res.status(200).json(result);
});

// @desc    Delete a chart
// @route   DELETE /api/account/chart/:id
// @access  Private
const deleteChart = asyncHandler(async (req, res) => {
  const chart = await Chart.findById(req.params.id).select("_id").lean();

  if (!chart) {
    res.status(400);
    throw new Error(C.getResourse404Id("Chart", req.params.id));
  }

  if (await Ledger.any({ chart: chart._id })) {
    res.status(402);
    throw new Error(C.getUnableToDel("Chart", "Ledger"));
  }

  const result = await Chart.deleteOne({ _id: req.params.id });

  res.status(200).json(result);
});

// @desc    Get ledger
// @route   GET /api/account/ledger
// @access  Private
const getLedger = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "-createdAt";
  const search = req.query.search;

  const query = {};

  if (req.query.chart) {
    query.chart = await UC.validateChartByName(req.query.chart);
  }

  if (search) {
    const fields = ["mode", "type"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(Ledger, query, "", page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

module.exports = {
  getBanks,
  getBank,
  addBank,
  updateBank,
  deleteBank,

  getCharts,
  getChart,
  addChart,
  updateChart,
  deleteChart,

  getLedger,
};
