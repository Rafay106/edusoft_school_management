const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const LibraryCategory = require("../models/library/categoryModel");
const LibrarySubject = require("../models/library/subjectModels");
const LibraryBook = require("../models/library/bookModel");
const Student = require("../models/studentInfo/studentModel");
const Staff = require("../models/hr/staffModels");
const LibraryIssueBook = require("../models/library/issueBookModel");


// @desc    Get all categories
// @route   GET /api/library/category
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "title";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["title"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
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

  const category = await LibraryCategory.findOne(query).lean();

  if (!category) {
    res.status(404);
    throw new Error(C.getResourse404Id("Category", req.params.id));
  }

  res.status(200).json(category);
});

// @desc    Add a category
// @route   POST /api/library/category
// @access  Private
const addCategory = asyncHandler(async (req, res) => {
  const ayear = UC.getCurrentAcademicYear(req.school);

  const category = await LibraryCategory.create({
    title: req.body.title,
    academic_year: ayear,
    school: req.school,
  });

  res.status(201).json({ msg: category._id });
});

// @desc    Update a category
// @route   PUT /api/library/category/:id
// @access  Private
const updateCategory = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await LibraryCategory.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("LibraryCategory", req.params.id));
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
  const category = await LibraryCategory.findById(req.params.id)
    .select("_id")
    .lean();

  if (!category) {
    res.status(400);
    throw new Error(C.getResourse404Id("Category", req.params.id));
  }

  // if (await Section.any({ academic_year: ayear._id })) {
  //   res.status(400);
  //   throw new Error(C.getUnableToDel("Category", "Section"));
  // } else if (await Student.any({ academic_year: ayear._id })) {
  //   res.status(400);
  //   throw new Error(C.getUnableToDel("Category", "Section"));
  // }

  const delQuery = { _id: req.params.id };

  if (C.isSchool(req.user.type)) delQuery.school = req.user.school;

  console.log(delQuery);

  const result = await LibraryCategory.deleteOne(delQuery);

  res.status(200).json(result);
});

// @desc    Get all categories
// @route   GET /api/library/category
// @access  Private
const getSubjects = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "title" || "name";
  const searchField = "all";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["title", "name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }
  const results = await UC.paginatedQuery(
    LibrarySubject,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a subject
// @route   GET /api/library/subject/:id
// @access  Private
const getSubject = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const subject = await LibrarySubject.findOne(query);
  if (!subject) {
    res.status(400);
    throw new Error(C.getResourse404Id("subject", req.params.id));
  }
  res.status(200).json(subject);
});

// @desc    Add a subject
// @route   POST /api/library/subject
// @access  Private
const addSubject = asyncHandler(async (req, res) => {
  const ayear = UC.getCurrentAcademicYear(req.school);

  if (!req.body.category) {
    res.status(400);
    throw new Error(C.getFieldIsReq("category"));
  }

  const category = await LibraryCategory.findOne({
    title: req.body.category.toUpperCase(),
  })
    .select("_id")
    .lean();

  if (!category) {
    res.status(400);
    throw new Error(C.getResourse404Id("category", req.body.category));
  }

  const subject = await LibrarySubject.create({
    name: req.body.name,
    category: category._id,
    subject_code: req.body.subject_code,
    academic_year: ayear,
    school: req.school,
  });

  res.status(201).json({ msg: subject._id });
});

// @desc    update a subject
// @route   PATCH /api/library/subject
// @access  Private
const updateSubject = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await LibrarySubject.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("LibrarySubject", req.params.id));
  }

  const updatedSubject = await LibrarySubject.updateOne(query, {
    $set: { name: req.body.name },
  });

  res.status(200).json(updatedSubject);
});

// @desc    delete a subject
// @route   DELETE /api/library/subject
// @access  Private
const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await LibrarySubject.findById(req.params.id)
    .select("_id")
    .lean();
  if (!subject) {
    res.status(400);
    throw new Error(C.getResourse404Id("subject", req.params.id));
  }

  const delQuery = { _id: req.params.id };

  if (C.isSchool(req.user.type)) delQuery.school = req.user.school;

  console.log(delQuery);

  const result = await LibrarySubject.deleteOne(delQuery);

  res.status(200).json(result);
});

//   book section

// @desc    get bookList
// @route   GET /api/library/book
// @access  Private
const getBooks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "title";
  const searchField = "all";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["title", "category", "subject", "book_no", "ISBN_no"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    LibraryBook,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a book
// @route   GET /api/library/subject/:id
// @access  Private
const getBook = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const book = await LibraryBook.findOne(query);
  if (!book) {
    res.status(400);
    throw new Error(C.getResourse404Id("book", req.params.id));
  }
  res.status(200).json(book);
});

// @desc    Add a book
// @route   POST /api/library/book
// @access  Private
const addBook = asyncHandler(async (req, res) => {
  const ayear = UC.getCurrentAcademicYear(req.school);

  const book = await LibraryBook.create({
    title: req.body.title,
    category: req.body.category,
    subject: req.body.subject,
    book_no: req.body.book_no,
    ISBN_NO: req.body.ISBN_NO,
    publisher_name: req.body.publisher_name,
    author_Name: req.body.author_name,
    rack_Number: req.body.rack_Number,
    quantity: req.body.quantity,
    book_Price: req.body.book_Price,
    description: req.body.description,

    academic_year: ayear,
    school: req.school,
  });

  res.status(201).json({ msg: book._id });
});

// @desc    update a book
// @route   PATCH /api/library/book
// @access  Private
const updateBook = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await LibraryBook.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("LibraryBook", req.params.id));
  }

  const updatedBook = await LibraryBook.updateOne(query, {
    $set: { title: req.body.title },
  });

  res.status(200).json(updatedBook);
});

// @desc    delete a book
// @route   DELETE /api/library/book
// @access  Private
const deleteBook = asyncHandler(async (req, res) => {
  const book = await LibraryBook.findById(req.params.id).select("_id").lean();

  if (!book) {
    res.status(400);
    throw new Error(C.getResourse404Id("book", req.params.id));
  }

  const delQuery = { _id: req.params.id };

  if (C.isSchool(req.user.type)) delQuery.school = req.user.school;

  console.log(delQuery);

  const result = await LibraryBook.deleteOne(delQuery);

  res.status(200).json(result);
});

// @desc    Get issue books
// @route   GET /api/library/issue-book
// @access  Private
const getIssueBooks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "title";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["title"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    LibraryIssueBook,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Add issue book
// @route   POST /api/library/issue-book
// @access  Private
const addIssueBook = asyncHandler(async (req, res) => {
  const type = req.body.type;
  const id = req.body.id;
  const book = req.body.book;
  const issueDate = req.body.issue_date;

  const ayear = UC.getCurrentAcademicYear(req.school);

  if (!type) {
    res.status(400);
    throw new Error(C.getFieldIsReq("type"));
  }

  if (!id) {
    res.status(400);
    throw new Error(C.getFieldIsReq("id"));
  }

  if (!book) {
    res.status(400);
    throw new Error(C.getFieldIsReq("book"));
  }

  if (!(await LibraryBook.any({ _id: book, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("book", book));
  }

  const issueBook = {
    book,
    issued_date: issueDate,
    status: "issued",
    academic_year: ayear,
    school: req.school,
  };

  if (type === "student") {
    const student = await Student.findOne({ _id: id, school })
      .select("_id")
      .lean();

    if (!student) {
      res.status(400);
      throw new Error(C.getResourse404Id("student", id));
    }

    const issuedBooks = await LibraryIssueBook.countDocuments({
      student: id,
      status: "issued",
    });

    const libraryVars = await UC.getLibraryVariables(school);

    if (
      libraryVars.book_issue_limit !== 0 &&
      libraryVars.book_issue_limit <= issuedBooks
    ) {
      return res.status(200).json({ msg: "Student book issue limit reached!" });
    }

    issueBook.student = id;
  } else if (type === "staff") {
    if (!(await Staff.any({ _id: id, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("staff", id));
    }

    issueBook.staff = id;
  } else {
    res.status(400);
    throw new Error("Invalid type!");
  }

  const issuedBook = await LibraryIssueBook.create(issueBook);

  res.status(200).json({ msg: issuedBook._id });
});

// @desc    Get member list
// @route   GET /api/library/issue-book/member-list
// @access  Private
const getMemberList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;
  const type = req.query.type;

  const query = {};
  const select = "admission_no name phone email class section";

  let results;
  if (type === "student") {
    if (search) {
      const fields = ["admission_no", "name.f", "name.m", "name.l"];

      const searchQuery = UC.createSearchQuery(fields, search);
      query["$or"] = searchQuery["$or"];
    }

    results = await UC.paginatedQuery(Student, query, select, 1, limit, sort, [
      "class section",
      "name",
    ]);
  } else if (type === "staff") {
    if (search) {
      const fields = ["name", "email"];

      const searchQuery = UC.createSearchQuery(fields, search);
      query["$or"] = searchQuery["$or"];
    }

    results = await UC.paginatedQuery(Staff, query, select, page, limit, sort);
  } else {
    res.status(400);
    throw new Error("Invalid type!");
  }

  if (!results) return res.status(400).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get member details
// @route   /api/library/issue-book/member-detail
// @access  private
const getMemberDetail = asyncHandler(async (req, res) => {
  const type = req.query.type;
  const id = req.query.id;

  let member = false;
  if (type === "student") {
    member = await Student.findById(id)
      .select("photo admission_no name class section school phone")
      .populate("class section school", "name")
      .lean();
  } else if (type === "staff") {
    member = await Staff.findById(id)
      .select("photo name role email mobile")
      .lean();
  } else {
    res.status(400);
    throw new Error("Invalid type!");
  }

  if (!member) {
    res.status(404);
    throw new Error("member not found!");
  }

  res.status(200).json(member);
});

//@desc     Return book
//@route    POST /api/library/issue-book/return
//@access   private
const returnIssueBook = asyncHandler(async (req, res) => {
  const query = { _id: req.body.issueId, status: "issued" };

  console.log(query);

  // find issue record
  const issueRecord = await LibraryIssueBook.findOne(query);

  if (!issueRecord) {
    res.status(404);
    throw new Error(C.getResourse404Id("issueId", req.body.issueId));
  }

  // Update the issue book record with the return date and mark it as returned
  const update = await LibraryIssueBook.updateOne(query, {
    $set: {
      status: "returned",
      return_date: req.body.returnDate || new Date().setHours(0, 0, 0, 0),
    },
  });

  res.status(200).json(update);
});

module.exports = {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
  getSubjects,
  getSubject,
  addSubject,
  updateSubject,
  deleteSubject,
  getBooks,
  addBook,
  getBook,
  updateBook,
  deleteBook,
  getMemberList,
  getIssueBooks,
  addIssueBook,
  getMemberDetail,
  returnIssueBook,
};
