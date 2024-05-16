const Razorpay = require("razorpay");
const RazorpayPayment = require("../models/fees/razorPayModel");

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_EMAIL } = process.env;

// Razorpay instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const createTermFeeOrder = async (student, amount) => {
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: RAZORPAY_EMAIL,
  });

  order.razorpay_key = RAZORPAY_KEY_ID;
  order.name = "Edusoft";
  order.description = "Student Term Fee Payment";

  order.stuName = student.name; // stuName;
  order.stuPhone = student.phone;
  order.stuEmail = student.email;
  order.stuAddress = student.address.permanent || "NA";

  await RazorpayPayment.create({
    order,
    student: student._id,
  });

  return order;
};

module.exports = {
  createTermFeeOrder,
};
