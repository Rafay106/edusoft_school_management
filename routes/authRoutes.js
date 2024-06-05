const asyncHandler = require("express-async-handler");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const C = require("../constants");
const UC = require("../utils/common");
const { generateToken } = require("../utils/fn_jwt");
const User = require("../models/system/userModel");
const Student = require("../models/studentInfo/studentModel");
const School = require("../models/system/schoolModel");
const {
  TemplatePrivilege,
} = require("../models/system/templatePrivilegeModel");
const { isEmailValid } = require("../utils/validators");

// @desc    Login User
// @route   POST /api/login
// @access  Private
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
      res.status(400);
      throw new Error(C.getFieldIsReq("email"));
    }

    if (!password) {
      res.status(400);
      throw new Error(C.getFieldIsReq("password"));
    }

    if (isEmailValid(email)) {
      const user = await User.findOne({ email }).select("password type").lean();

      if (!user) {
        res.status(404);
        throw new Error(`User with email: ${email} not found!`);
      }

      if (!(await bcrypt.compare(password, user.password))) {
        res.status(401);
        throw new Error(C.INVALID_CREDENTIALS);
      }

      const token = generateToken(user._id, user.password);

      delete user.password;

      return res.status(200).json({ ...user, ...token });
    }

    const admissionNo = email.toUpperCase();

    const student = await Student.findByAdmNo(admissionNo);

    if (!student) {
      res.status(404);
      throw new Error(`Student with admission_no: ${email} not found!`);
    }

    // return res.json(student);

    const parent = await User.findOne({ username: admissionNo })
      .select("type password")
      .lean();

    if (parent) {
      if (!(await bcrypt.compare(password, parent.password))) {
        res.status(401);
        throw new Error(C.INVALID_CREDENTIALS);
      }

      const token = generateToken(parent._id, parent.password);

      delete parent.password;

      return res.status(200).json({ ...parent, ...token });
    } else {
      if (student.parent) {
        const parent_ = await User.findById(student.parent)
          .select("type password")
          .lean();

        if (parent_) {
          if (!(await bcrypt.compare(password, parent_.password))) {
            res.status(401);
            throw new Error(C.INVALID_CREDENTIALS);
          }

          const token = generateToken(parent._id, parent.password);

          delete parent.password;

          return res.status(200).json({ ...parent, ...token });
        }
      }

      const template = await TemplatePrivilege.findOne({
        type: C.PARENT,
      }).lean();

      const newParent = await User.create({
        name: `${student.name}'s parent`,
        email: student.email,
        username: student.admission_no,
        password: "123456",
        phone: student.phone,
        type: C.PARENT,
        privileges: template.privileges,
        school: student.school,
      });

      await Student.updateOne(
        { _id: student._id },
        { $set: { parent: newParent._id } }
      );

      const token = generateToken(newParent._id, newParent.password);

      const result = {
        _id: newParent._id,
        type: newParent.type,
        token: token.token,
      };

      res.status(200).json(result);
    }
  })
);

module.exports = router;
