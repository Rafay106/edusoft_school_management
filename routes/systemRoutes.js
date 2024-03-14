const express = require("express");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const SC = require("../controllers/systemController");
const User = require("../models/system/userModel");
const Privilege = require("../models/system/privilegeModel");

const router = express.Router();

router.route("/privilege").get(SC.getPrivileges).post(SC.addPrivilege);
router
  .route("/privilege/:id")
  .get(SC.getPrivilege)
  .patch(SC.updatePrivilege)
  .delete(SC.deletePrivilege);

router.post(
  "/init",
  asyncHandler(async (req, res) => {
    const key = req.body.key;

    if (await User.any({ type: C.SUPERADMIN })) {
      res.status(400);
      throw new Error("Superadmin already exists");
    }

    if (key !== process.env.SECRET) {
      res.status(400);
      throw new Error("Invalid Key");
    }

    // // Superadmin
    // await Privilege.create({
    //   type: C.SUPERADMIN,
    //   privileges: {
    //     user: { read: true, write: true, update: true, delete: true },
    //     school: { read: true, write: true, update: true, delete: true },
    //     busStaff: { read: true, write: true, update: true, delete: true },
    //     busStop: { read: true, write: true, update: true, delete: true },
    //     bus: { read: true, write: true, update: true, delete: true },
    //     student: { read: true, write: true, update: true, delete: true },
    //     util: { read: true, write: true, update: true, delete: true },
    //   },
    // });

    // // Admin
    // await Privilege.create({
    //   type: C.ADMIN,
    //   privileges: {
    //     user: { read: true, write: true, update: true, delete: true },
    //     school: { read: true, write: true, update: true, delete: true },
    //     busStaff: { read: true, write: true, update: true, delete: true },
    //     busStop: { read: true, write: true, update: true, delete: true },
    //     bus: { read: true, write: true, update: true, delete: true },
    //     student: { read: true, write: true, update: true, delete: true },
    //     util: { read: true, write: true, update: true, delete: true },
    //   },
    // });

    // // Manager
    // await Privilege.create({
    //   type: C.MANAGER,
    //   privileges: {
    //     user: { read: true, write: true, update: true, delete: true },
    //     school: { read: true, write: true, update: true, delete: true },
    //     busStaff: { read: true, write: true, update: true, delete: true },
    //     busStop: { read: true, write: true, update: true, delete: true },
    //     bus: { read: true, write: true, update: true, delete: true },
    //     student: { read: true, write: true, update: true, delete: true },
    //     util: { read: true, write: true, update: true, delete: true },
    //   },
    // });

    // // School
    // await Privilege.create({
    //   type: C.SCHOOL,
    //   privileges: {
    //     user: { read: true, write: true, update: true, delete: true },
    //     school: { read: true, write: true, update: true, delete: true },
    //     busStaff: { read: true, write: true, update: true, delete: true },
    //     busStop: { read: true, write: true, update: true, delete: true },
    //     bus: { read: true, write: true, update: true, delete: true },
    //     student: { read: true, write: true, update: true, delete: true },
    //     util: { read: true, write: true, update: true, delete: true },
    //   },
    // });

    const superadmin = await User.create({
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      phone: req.body.phone,
      type: C.SUPERADMIN,
    });

    res.status(201).json({ success: true, msg: superadmin._id });
  })
);

module.exports = router;
