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

  const category = await Category.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!category) {
    res.status(404);
    throw new Error(C.getResourse404Error("Category", req.params.id));
  }

  res.status(200).json(category);
});

// @desc    Add a category
// @route   POST /api/library/category
// @access  Private
const addCategory = asyncHandler(async (req, res) => {
  const school = await UC.validateSchool(req.user, req.body.school);

  const ayear = await UC.getCurrentAcademicYear(school);

  const category = await LibraryCategory.create({
    title: req.body.title,
    academic_year: ayear,
    school,
  });

  res.status(201).json({ msg: category._id });
});

// @desc    Update a category
// @route   PUT /api/library/category/:id
// @access  Private
const updateCategory = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;

  if (!(await LibraryCategory.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("LibraryCategory", req.params.id));
  }

  const result = await LibraryCategory.updateOne(query, {
    $set: { title: req.body.title },
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
