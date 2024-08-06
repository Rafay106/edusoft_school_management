const asyncHandler = require("express-async-handler");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const C = require("../constants");
const UC = require("../utils/common");
const { generateToken } = require("../utils/fn_jwt");
const User = require("../models/system/userModel");
const Student = require("../models/studentInfo/studentModel");
const School = require("../models/system/schoolModel");
const RolePrivilege = require("../models/system/rolePrivilegeModel");
const { isEmailValid } = require("../utils/validators");
const Staff = require("../models/hr/staffModel");
const Role = require("../models/system/roleModel");

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

    const user = await User.findOne({
      $or: [{ email }, { username: email }, { username: email.toUpperCase() }],
    })
      .select("password role")
      .populate("role", "title")
      .lean();

    if (user) {
      if (!(await bcrypt.compare(password, user.password))) {
        res.status(401);
        throw new Error(C.INVALID_CREDENTIALS);
      }

      const token = generateToken(user._id, user.password);

      delete user.password;

      return res.status(200).json({ ...user, ...token });
    }

    // If no user found with email or username

    const admissionNo = email.toUpperCase();

    const student = await Student.findByAdmNo(admissionNo);

    // If student is found then parent is trying to login fist time
    if (student) {
      const newParent = await createParentFromStudent(student);

      const token = generateToken(newParent._id, newParent.password);

      const result = {
        _id: newParent._id,
        role: { _id: newParent.role, title: C.PARENT },
        token: token.token,
      };

      return res.status(200).json(result);
    }

    const staff = await Staff.findOne({ email }).lean();

    if (staff) {
      const newStaff = await createStaff(staff);

      const role = await Role.findById(newStaff.role).select("title").lean();

      const token = generateToken(newStaff._id, newStaff.password);

      const result = {
        _id: newStaff._id,
        role,
        token: token.token,
      };

      return res.status(200).json(result);
    }

    res.status(400);
    throw new Error("Invalid credentials!");
  })
);

const createParentFromStudent = async (student) => {
  let parent = await User.findOne({ email: student.email })
    .select("password")
    .lean();

  if (!parent) {
    const role = await UC.getRoleId(C.PARENT);

    if (!role) {
      throw new Error(C.getResourse404Id("Role", C.PARENT));
    }

    parent = await User.create({
      name: `${student.name}'s parent`,
      email: student.email,
      username: student.admission_no,
      password: "123456",
      phone: student.phone,
      role,
      school: student.school,
    });
  }

  await Student.updateOne(
    { _id: student._id },
    { $set: { parent: parent._id } }
  );

  return parent;
};

const createStaff = async (staff) => {
  const newStaff = await User.create({
    name: `${staff.salutation} ${staff.name}`,
    email: staff.email,
    username: UC.replaceEmailSymbols(staff.email.split("@")[0]),
    password: "123456",
    phone: staff.mobile.primary,
    role: staff.role,
    school: staff.school,
  });

  return newStaff;
};

module.exports = router;
