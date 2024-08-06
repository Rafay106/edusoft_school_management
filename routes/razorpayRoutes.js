const router = require("express").Router();
const {
  verifyStudentFeePayment,
  verifyStudentFeePaymentFlutter,
  addSchoolToReq,
} = require("../tools/razorpay");

router.post(
  "/verify/student-fee-payment",
  addSchoolToReq,
  verifyStudentFeePayment
);
router.post(
  "/verify/student-fee-payment-flutter",
  addSchoolToReq,
  verifyStudentFeePaymentFlutter
);

module.exports = router;
