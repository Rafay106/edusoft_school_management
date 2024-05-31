const C = require("../constants");
const UC = require("../utils/common");
const WhatsappCoinTransaction = require("../models/system/whatsappCoinTransactionModel");
const School = require("../models/system/schoolModel");

async function credit(amount) {
  amount = Math.abs(parseInt(amount));

  if (isNaN(amount)) throw new Error("Invalid amount!");

  const school = await School.findOne().select("whatsapp_coins").lean();

  if (!school) throw new Error("School not created!");

  const currentCoins = school.whatsapp_coins;

  await School.updateOne(
    { _id: school._id },
    { $inc: { whatsapp_coins: amount } }
  );

  const transaction = await WhatsappCoinTransaction.create({
    mode: "credit",
    coins: {
      amount,
      previous: currentCoins,
      final: currentCoins + amount,
    },
  });

  UC.writeLog(
    "whatsapp_coin_transactions",
    `Credit: success | transaction: ${transaction._id}`
  );

  return true;
}

async function debit(amount) {
  amount = Math.abs(parseInt(amount));

  if (isNaN(amount)) throw new Error("Invalid amount!");

  const school = await School.findOne().select("whatsapp_coins").lean();

  if (!school) throw new Error("School not created!");

  const currentCoins = school.whatsapp_coins;

  if (school.whatsapp_coins < amount) throw new Error("Insufficient Coins!");

  await School.updateOne(
    { _id: school._id },
    { $inc: { whatsapp_coins: -amount } }
  );

  const transaction = await WhatsappCoinTransaction.create({
    mode: "debit",
    coins: {
      amount,
      previous: currentCoins,
      final: currentCoins - amount,
    },
  });

  UC.writeLog(
    "whatsapp_coin_transactions",
    `Debit: success | transaction: ${transaction._id}`
  );

  return true;
}

module.exports = {
  credit,
  debit,
};
