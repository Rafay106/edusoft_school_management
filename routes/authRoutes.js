const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const User = require("../models/system/userModel");
const C = require("../constants");
const { generateToken } = require("../utils/fn_jwt");
const Student = require("../models/system/studentModel");
const School = require("../models/system/schoolModel");

// @desc    Register User
// @route   POST /api/login
// @access  Private
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select("email username name phone type manager school password")
      .populate("manager school", "name")
      .lean();

    if (!user) {
      res.status(401);
      throw new Error(C.INVALID_CREDENTIALS);
    }

    if (!(await bcrypt.compare(password, user.password))) {
      res.status(401);
      throw new Error(C.INVALID_CREDENTIALS);
    }

    const token = generateToken(user._id);

    delete user.privileges;
    delete user.password;
    delete user.__v;

    if (C.isSchool(user.type)) {
      user.school = await School.findOne({ school: user._id }).lean();
    }

    res.status(200).json({ ...user, ...token });
  })
);

// @desc    Register User
// @route   POST /api/login
// @access  Private
router.post(
  "/parent",
  asyncHandler(async (req, res) => {
    const admissionNo = req.params.admNo;

    const student = await Student.findOne({ admissionNo });

    if (!student) {
      res.status(401);
      throw new Error(C.getResourse404Error("Student", admissionNo));
    }

    const token = generateToken({ _id: student._id, admissionNo });

    res.status(200).json(token);
  })
);

module.exports = router;
