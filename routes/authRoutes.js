const asyncHandler = require("express-async-handler");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const C = require("../constants");
const UC = require("../utils/common");
const { generateToken } = require("../utils/fn_jwt");
const User = require("../models/system/userModel");
const Student = require("../models/studentInfo/studentModel");
const School = require("../models/system/schoolModel");
const TemplatePrivilege = require("../models/system/templatePrivilegeModel");

// @desc    Register User
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

    const user = await User.findOne({ email })
      .select("email username name phone type school password")
      .populate("school", "name")
      .lean();

    if (user) {
      if (!(await bcrypt.compare(password, user.password))) {
        res.status(401);
        throw new Error(C.INVALID_CREDENTIALS);
      }

      const token = generateToken(user._id, user.password);

      delete user.privileges;
      delete user.password;
      delete user.__v;

      if (C.isSchool(user.type)) {
        user.school = await School.findOne({ school: user._id }).lean();
      }

      return res.status(200).json({ ...user, ...token });
    }

    const admissionNo = email.toUpperCase();

    const parentUser = await User.findOne({ username: admissionNo })
      .select("email username name phone type school password")
      .populate("school", "name")
      .lean();

    if (parentUser) {
      if (!(await bcrypt.compare(password, parentUser.password))) {
        res.status(401);
        throw new Error(C.INVALID_CREDENTIALS);
      }

      const student = await Student.findOne({ admission_no: admissionNo })
        .select(
          "roll_no name email phone photo age class section bus_pick bus_drop"
        )
        .populate("class section", "name")
        .populate("bus_pick bus_drop", "name no_plate")
        .lean();

      if (!student) {
        res.status(404);
        throw new Error(`Student not found with admission_no: ${admissionNo}`);
      }

      if (!student.photo) student.photo = "/user-blank.svg";

      const token = generateToken(parentUser._id, parentUser.password);

      delete parentUser.privileges;
      delete parentUser.password;
      delete parentUser.__v;

      parentUser.student = student;

      return res.status(200).json({ ...parentUser, ...token });
    } else {
      const student = await Student.findOne({ admission_no: admissionNo })
        .select(
          "roll_no photo class section bus_pick bus_drop email phone parent"
        )
        .populate("class section", "name")
        .populate("bus_pick bus_drop", "name no_plate")
        .lean();

      if (!student) {
        res.status(401);
        throw new Error(C.INVALID_ADMNO);
      }

      if (student.parent) {
        const parent = await User.findById(student.parent)
          .select("email username name phone type school password")
          .populate("school", "name")
          .lean();

        if (parent) {
          if (!(await bcrypt.compare(password, parent.password))) {
            res.status(401);
            throw new Error(C.INVALID_CREDENTIALS);
          }

          const token = generateToken(parent._id, parent.password);

          delete parent.privileges;
          delete parent.password;
          delete parent.__v;

          parent.student = student;

          return res.status(200).json({ ...parent, ...token });
        }
      }

      const template = await TemplatePrivilege.findOne({
        type: C.PARENT,
      }).lean();

      const newParentUser = await User.create({
        email: student.email,
        password: "123456",
        name: `${student.name}'s parent`,
        phone: student.phone,
        type: C.PARENT,
        privileges: template.privileges,
        school: student.school,
      });

      await Student.updateOne(
        { _id: student._id },
        { $set: { parent: newParentUser._id } }
      );

      const token = generateToken(newParentUser._id, newParentUser.password);

      const parentObj = {
        email: newParentUser.email,
        name: newParentUser.name,
        phone: newParentUser.phone,
        type: newParentUser.type,
        school: newParentUser.school,
      };

      res.status(200).json({ ...parentObj, ...token });
    }
  })
);

// @desc    Register User
// @route   POST /api/login/parent
// @access  Private
router.post(
  "/parent",
  asyncHandler(async (req, res) => {
    const { adm_no: admNo, password } = req.body;

    const student = await Student.findOne({ admission_no: admNo }).lean();

    if (!student) {
      res.status(401);
      throw new Error(C.INVALID_CREDENTIALS);
    }

    if (!(await bcrypt.compare(password, student.password))) {
      res.status(401);
      throw new Error(C.INVALID_CREDENTIALS);
    }

    const token = generateToken(student._id);

    delete student.password;
    delete student.__v;

    res.status(200).json({ ...student, ...token });
  })
);

module.exports = router;
