const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Notice = require("../models/comms/noticeBoardModel");

// @desc    Get all notices
// @route   GET /api/comms/notice
// @access  Private
const getNotices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "createdAt";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(Notice, query, {}, page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a notice
// @route   GET /api/comms/notice/:id
// @access  Private
const getNotice = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const notice = await Notice.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!notice) {
    res.status(404);
    throw new Error(C.getResourse404Id("Notice", req.params.id));
  }

  res.status(200).json(notice);
});

// @desc    Add a notice
// @route   POST /api/comms/notice
// @access  Private
const addNotice = asyncHandler(async (req, res) => {
  const sent_to = req.body.sent_to;

  const notice = await Notice.create({
    title: req.body.title,
    notice: req.body.notice,
    is_published_website: req.body.is_published_website,
    notice_date: req.body.notice_date,
    publish_date: req.body.publish_date,
    sent_to,
    school: req.school,
  });

  res.status(201).json({ msg: notice._id });
});

// @desc    Update a notice
// @route   PUT /api/comms/notice/:id
// @access  Private
const updateNotice = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const notice = await Notice.findOne(query).select("_id").lean();

  if (!notice) {
    res.status(404);
    throw new Error(C.getResourse404Id("Notice", req.params.id));
  }

  const result = await Notice.updateOne(query, {
    $set: { title: req.body.title },
  });

  res.status(200).json(result);
});

// @desc    Delete a notice
// @route   DELETE /api/comms/notice/:id
// @access  Private
const deleteNotice = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const result = await Notice.deleteOne(query);

  res.status(200).json(result);
});

module.exports = {
  getNotices,
  getNotice,
  addNotice,
  updateNotice,
  deleteNotice,
};
