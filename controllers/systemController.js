const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Privilege = require("../models/system/privilegeModel");

// @desc    Get Privileges
// @route   GET /api/admin-panel/privilege
// @access  Private
const getPrivileges = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "type";
  const searchField = req.query.sf;
  const searchValue = req.query.sv;

  const query = {};

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = ["type"];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  const results = await UC.paginatedQuery(
    Privilege,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a Privilege
// @route   GET /api/admin-panel/privilege/:id
// @access  Private
const getPrivilege = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const privilege = await Privilege.findOne(query).lean();

  if (!privilege) {
    res.status(404);
    throw new Error(C.getResourse404Error("Privilege", req.params.id));
  }

  res.status(200).json(privilege);
});

// @desc    Create a Privilege
// @route   POST /api/admin-panel/privilege
// @access  Private
const addPrivilege = asyncHandler(async (req, res) => {
  const { type, privileges } = req.body;

  const privilege = await Privilege.create({
    type,
    privileges,
  });

  res.status(201).json({ msg: privilege._id });
});

// @desc    Update a Privilege
// @route   PATCH /api/admin-panel/privilege/:id
// @access  Private
const updatePrivilege = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  const privileges = req.body.privileges;

  const result = await Privilege.updateOne(query, {
    $set: {
      type: req.body.type,
      "privileges.user": privileges?.user,
      "privileges.school": privileges?.school,
      "privileges.busStaff": privileges?.busStaff,
      "privileges.busStop": privileges?.busStop,
      "privileges.bus": privileges?.bus,
      "privileges.student": privileges?.student,
      "privileges.util": privileges?.util,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a user
// @route   DELETE /api/admin-panel/privilege/:id
// @access  Private
const deletePrivilege = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const result = await Privilege.deleteOne(query);

  res.status(200).json(result);
});

module.exports = {
  getPrivileges,
  getPrivilege,
  addPrivilege,
  updatePrivilege,
  deletePrivilege,
};
