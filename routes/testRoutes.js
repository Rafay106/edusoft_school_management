const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const RazorpayPayment = require("../models/fees/razorPayModel");

router.post(
  "/1",
  asyncHandler(async (req, res) => {
    const orders = [
      "order_Nw1WoYnr7K8aEe",
      "order_Nw1YPdVxzvQPAq",
      "order_Nw1arojN0akhko",
      "order_Nw1cSXRc72bAQJ",
      "order_Nw1fRc3K1hmNbg",
      "order_Nw1h1XMnO0r1OP",
      "order_Nw1ja0n6sDmtPj",
      "order_Nw1kmLcqmaKNmT",
      "order_Nw1mjZev9kr7dL",
      "order_Nw1on3v7DAYKYb",
    ];

    const result = await RazorpayPayment.find({ "order.id": orders });

    res.json(result);
  })
);

module.exports = router;
