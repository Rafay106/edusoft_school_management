const express = require("express");
const LC = require("../controllers/libraryController");

const libraryRouter = express.Router();

const categoryRouter = express.Router();

// @desc    library category
// @route   /api/library/category
// @access  Private
categoryRouter.route("/").get(LC.getCategories).post(LC.addCategory);
categoryRouter
  .route("/:id")
  .get(LC.getCategory)
  .patch(LC.updateCategory)
  .delete(LC.deleteCategory);

const subjectRouter = express.Router();

// @desc    library subjects
// @route    /api/library/subject
//  @access private
subjectRouter.route("/").get(LC.getSubjects).post(LC.addSubject);
subjectRouter
  .route("/:id")
  .get(LC.getSubject)
  .patch(LC.updateSubject)
  .delete(LC.deleteSubject);

const bookRouter = express.Router();

// @desc    library books
// @route   /api/library/book
// @access  private
bookRouter.route("/").get(LC.getBooks).post(LC.addBook);
bookRouter
  .route("/:id")
  .get(LC.getBook)
  .patch(LC.updateBook)
  .delete(LC.deleteBook);

const issueBookRouter = express.Router();

// @desc    library issueBookMember
// @route   /api/library/issueBookMember
// @access  private
issueBookRouter.route("/").get(LC.getIssueBooks);
issueBookRouter.route("/issue").post(LC.addIssueBook);
// issueBookRouter.route("/return").get(LC.returnIssueBook);
issueBookRouter.route("/member-list").get(LC.getMemberList);
issueBookRouter.route("/member-detail").get(LC.getMemberDetail);
issueBookRouter.route("/return").patch(LC.returnIssueBook);



libraryRouter.use("/category", categoryRouter);
libraryRouter.use("/subject", subjectRouter);
libraryRouter.use("/book", bookRouter);
libraryRouter.use("/issue-book", issueBookRouter);


module.exports = libraryRouter;
