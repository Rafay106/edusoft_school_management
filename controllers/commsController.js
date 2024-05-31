const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Notice = require("../models/comms/noticeBoardModel");
const { sendEmailQueue } = require("../tools/email");
const Student = require("../models/studentInfo/studentModel");
const User = require("../models/system/userModel");
const { isEmailValid } = require("../utils/validators");
const { sendWhatsappQueue } = require("../tools/whatsapp_aisensy");
const { sendPushQueue } = require("../tools/push");

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

  for (const notice of results.result) {
    notice.file = `${process.env.DOMAIN}/uploads/notice/${notice.file}`;
  }

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

  notice.file = `${process.env.DOMAIN}/uploads/notice/${notice.file}`;

  res.status(200).json(notice);
});

// @desc    Add a notice
// @route   POST /api/comms/notice
// @access  Private
const addNotice = asyncHandler(async (req, res) => {
  const file = req.file ? req.file.filename : "";

  const notice = await Notice.create({
    title: req.body.title,
    notice: req.body.notice,
    publish_date: req.body.publish_date,
    file,
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

// @desc    Send message via email, whatsapp or push
// @route   POST /api/comms/send-msg
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const msg = req.body.msg;
  const sendType = req.body.send_type;

  if (!req.body.channels) {
    res.status(400);
    throw new Error(C.getFieldIsReq("channels"));
  }

  const channels = req.body.channels.split(",");

  if (!msg) {
    res.status(400);
    throw new Error(C.getFieldIsReq("msg"));
  }

  if (!sendType) {
    res.status(400);
    throw new Error(C.getFieldIsReq("send_type"));
  }

  if (!req.body.user_types) {
    res.status(400);
    throw new Error(C.getFieldIsReq("user_types"));
  }

  const userTypes = req.body.user_types.split(",");

  let receivers = [];
  if (sendType == "group") {
    receivers = await UC.getUserContactInfo(
      userTypes.map((ele) => ele.toLowerCase())
    );
  } else if (sendType == "individual") {
    if (!req.body.user_ids) {
      res.status(400);
      throw new Error(C.getFieldIsReq("user_ids"));
    }

    const userIds = req.body.user_ids.split(",");

    if (userIds.length === 0) {
      res.status(400);
      throw new Error(C.getFieldIsReq("user_ids"));
    }

    receivers = await UC.getUserContactInfo(userTypes, userIds);
  } else if (sendType == "class") {
    const classId = await UC.validateClassByName(req.body.class, req.ayear);
    const sectionIds = await UC.validateSections(
      req.body.sections.split(","),
      req.ayear
    );

    const students = await Student.find({ class: classId, section: sectionIds })
      .select("email phone parent")
      .lean();

    if (userTypes.includes(C.STUDENT)) receivers = students;
    else if (userTypes.include(C.PARENT)) {
      const parentIds = students.map((ele) => ele.parent);
      const parents = await User.find({ _id: parentIds, type: C.PARENT })
        .select("email phone")
        .lean();

      receivers = parents;
    } else receivers = [];
  } else {
    res.status(400);
    throw new Error("Invalid send_type!");
  }

  const title = req.school.name + ": Notice";

  for (const channel of channels) {
    if (channel == "email") {
      const attachments = req.file ? [path.resolve(req.file.path)] : [];

      await sendEmailQueue(
        receivers.map((ele) => ele.email),
        title,
        msg,
        "",
        attachments
      );
    } else if (channel == "whatsapp") {
      let campaignName = "notice_text_acharyakulam";

      const fileType = req.file ? path.extname(req.file.path) : false;
      let media = {};

      if (fileType) {
        if ([".jpeg", ".jpg", ".png"].includes(fileType)) {
          campaignName = "notice_image_acharyakulam";
        } else campaignName = "notice_document_acharyakulam";

        media = {
          url: `${process.env.DOMAIN}/uploads/notice/${req.file.filename}`,
          filename: req.file.filename,
        };
      }

      const destinations = receivers.map((ele) =>
        ele.phone.includes("+91") ? ele.phone : `+91${ele.phone}`
      );

      const templateParams = [msg];

      await sendWhatsappQueue(
        campaignName,
        destinations,
        templateParams,
        media
      );
    } else if (channel == "push") {
      const media = { app: "", web: "" };

      if (req.file) {
        media.app = `${process.env.DOMAIN}/uploads/notice/${req.file.filename}`;
        media.web = `${process.env.DOMAIN}/uploads/notice/${req.file.filename}`;
      }

      await sendPushQueue(
        receivers.map((ele) => ele._id),
        title,
        msg,
        media
      );
    }
  }

  res.status(200).json({ msg: "OK" });
});

module.exports = {
  getNotices,
  getNotice,
  addNotice,
  updateNotice,
  deleteNotice,

  sendMessage,
};
