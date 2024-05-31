const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Notice = require("../models/comms/noticeBoardModel");

// @desc    Get all notices from api_key
// @route   GET /api/comms/notice/api_key
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

  for (const notice of results.result) {
    notice.file = `${process.env.DOMAIN}/uploads/notice/${notice.file}`;
  }

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

module.exports = {
  getNotices,
};
