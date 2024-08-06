const assert = require("node:assert");
const C = require("../constants");
const UC = require("../utils/common");
const { default: mongoose } = require("mongoose");
const Bank = require("../models/account/bankModel");
const Ledger = require("../models/account/ledgerModel");
const Chart = require("../models/account/chartModel");
const School = require("../models/system/schoolModel");

const getSystemChart = async (head) => {
  head = head.toUpperCase();

  let chart = await Chart.findOne({ head }).lean();

  if (chart) return chart;

  if (head === C.FEE_COLLECTION) {
    chart = await Chart.create({ head, type: C.INCOME });
  }

  return chart;
};

const debit = async (mode, amount, note, chartHead, bankName = "") => {
  assert(mode !== undefined, "mode is required!");
  assert(note !== undefined, "note is required!");
  assert(amount !== undefined, "amount is required!");
  assert(chartHead !== undefined, "chartHead is required!");
  assert(typeof amount === "number", "amount must be number!");

  try {
    const chart = await getSystemChart(chartHead);
    if (!chart) throw new Error(C.getResourse404Id("Chart", chartHead));

    const ledgerData = {
      mode,
      type: "debit",
      amount,
      note,
      chart: chart._id,
    };

    if (mode !== C.CASH) {
      const query = {};

      if (mongoose.isValidObjectId(bankName)) query._id = bankName;
      else query.bank_name = bankName.toUpperCase();

      const bank = await Bank.findOne(query).lean();

      if (!bank) throw new Error(C.getResourse404Id("Bank", bankName));

      const balance = bank.balance - amount;

      await Bank.updateOne({ _id: bank._id }, { $set: { balance } });

      ledgerData.balance = balance;
      ledgerData.bank = bank._id;
    } else {
      const school = await School.findOne().select("cash_amount").lean();

      const balance = school.cash_amount - amount;
      await School.updateOne({}, { $set: { cash_amount: balance } });

      ledgerData.balance = balance;
    }

    const ledger = await Ledger.create(ledgerData);

    return ledger;
  } catch (err) {
    UC.writeLog("ledger", err.name + ": " + JSON.stringify(err.stack));
    return false;
  }
};

const credit = async (mode, amount, note, chartHead, bankName = "") => {
  assert(mode !== undefined, "mode is required!");
  assert(note !== undefined, "note is required!");
  assert(amount !== undefined, "amount is required!");
  assert(chartHead !== undefined, "chartHead is required!");
  assert(typeof amount === "number", "amount must be number!");

  try {
    const chart = await getSystemChart(chartHead);
    if (!chart) throw new Error(C.getResourse404Id("Chart", chartHead));

    const ledgerData = {
      mode,
      type: "credit",
      amount,
      note,
      chart: chart._id,
    };

    if (mode !== C.CASH) {
      const query = {};

      if (mongoose.isValidObjectId(bankName)) query._id = bankName;
      else query.bank_name = bankName.toUpperCase();

      const bank = await Bank.findOne(query).lean();

      if (!bank) throw new Error(C.getResourse404Id("Bank", bankName));

      const balance = bank.balance + amount;

      await Bank.updateOne({ _id: bank._id }, { $set: { balance } });

      ledgerData.balance = balance;
      ledgerData.bank = bank._id;
    } else {
      const school = await School.findOne().select("cash_amount").lean();

      const balance = school.cash_amount + amount;
      await School.updateOne({}, { $set: { cash_amount: balance } });

      ledgerData.balance = balance;
    }

    const ledger = await Ledger.create(ledgerData);

    return ledger;
  } catch (err) {
    console.log(err);
    UC.writeLog("ledger", err.name + ": " + JSON.stringify(err.stack));
    return false;
  }
};

module.exports = {
  debit,
  credit,
};
