const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const LibraryCategory = require("../models/library/categoryModel");

// @desc    Get all categories
// @route   GET /api/library/category
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "title";
  const searchField = "all";
  const searchValue = req.query.search;

  const query = {};

  if (C.isSchool(req.user.type)) query.school = req.user._id;

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = ["title"];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  const results = await UC.paginatedQuery(
    LibraryCategory,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a category
// @route   GET /api/library/category/:id
// @access  Private
const getCategory = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const academicYear = await Category.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!academicYear) {
    res.status(404);
    throw new Error(C.getResourse404Error("Category", req.params.id));
  }

  res.status(200).json(academicYear);
});

// @desc    Add a category
// @route   POST /api/library/category
// @access  Private
const addCategory = asyncHandler(async (req, res) => {
  [manager, school] = await UC.validateManagerAndSchool(
    req.user,
    manager,
    school
  );

  const year = req.body.year;
  let starting_date = req.body.starting_date;
  let ending_date = req.body.ending_date;
  const setDefault = req.body.set_default;

  if (year.length > 4) {
    res.status(400);
    throw new Error("The year must be 4 digits.");
  }

  if (isNaN(parseInt(year))) {
    res.status(400);
    throw new Error("The year must be a number.");
  }

  starting_date = new Date(starting_date).setUTCHours(0, 0, 0, 0);
  ending_date = new Date(ending_date).setUTCHours(0, 0, 0, 0);

  const academicYear = await Category.create({
    year,
    title: req.body.title,
    starting_date,
    ending_date,
    manager,
    school,
  });

  if (setDefault) {
    await School.updateOne(
      { school },
      { $set: { current_academic_year: academicYear._id } }
    );
  }

  res.status(201).json({ msg: academicYear._id });
});

// @desc    Update a category
// @route   PUT /api/library/category/:id
// @access  Private
const updateCategory = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await Category.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("Category", req.params.id));
  }

  const year = req.body.year;
  let starting_date = req.body.starting_date;
  let ending_date = req.body.ending_date;

  if (year) {
    if (year.length > 4) {
      res.status(400);
      throw new Error("The year must be 4 digits.");
    }

    if (isNaN(parseInt(year))) {
      res.status(400);
      throw new Error("The year must be a number.");
    }
  }

  if (starting_date) {
    starting_date = new Date(starting_date).setUTCHours(0, 0, 0, 0);
  }

  if (ending_date) {
    ending_date = new Date(ending_date).setUTCHours(0, 0, 0, 0);
  }

  const result = await Category.updateOne(query, {
    $set: {
      year,
      title: req.body.title,
      starting_date,
      ending_date,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a category
// @route   DELETE /api/library/category/:id
// @access  Private
const deleteCategory = asyncHandler(async (req, res) => {
  const ayear = await Category.findById(req.params.id).select("_id").lean();

  if (!ayear) {
    res.status(400);
    throw new Error(C.getResourse404Error("Category", req.params.id));
  }

  if (await Section.any({ academic_year: ayear._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("Category", "Section"));
  } else if (await Student.any({ academic_year: ayear._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("Category", "Section"));
  }

  const delQuery = { _id: req.params.id };

  if (C.isSchool(req.user.type)) delQuery.school = req.user._id;
  else if (C.isManager(req.user.type)) delQuery.manager = req.user._id;

  const result = await Category.deleteOne(delQuery);

  res.status(200).json(result);
});

module.exports = {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
};
