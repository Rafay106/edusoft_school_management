const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const User = require("../models/system/userModel");
const Student = require("../models/studentInfo/studentModel");
const StuBusAtt = require("../models/attendance/studentBusAttendanceModel");
const StudentNotification = require("../models/studentInfo/studentNotificationModel");
const Bus = require("../models/transport/busModel");
const { isMorningTime } = require("../services/attendance");
const FeePaid = require("../models/fees/feePaidModel");
const FEE = require("../utils/fees");
const FeeTerm = require("../models/fees/feeTermModel");
const { createStudentFeeOrder } = require("../tools/razorpay");
const RazorpayFeePayment = require("../models/fees/razorpayFeePaymentModel");
const StuClassAtt = require("../models/attendance/studentClassAttendanceModel");
const HomeworkSubmission = require("../models/tution/homeworkSubmissionModel");
const Notice = require("../models/comms/noticeBoardModel");
const NoticeSeen = require("../models/comms/noticeBoardSeenModel");
const { DOMAIN } = process.env;

// @desc    Get parent info
// @route   POST /api/parent/account-info
// @access  Private
const getParentAccountInfo = asyncHandler(async (req, res) => {
  const parent = await User.findById(req.user._id)
    .select("-password")
    .populate("role", "title")
    .populate("school")
    .lean();

  if (!parent) {
    res.status(400);
    throw new Error(C.getResourse404Id("User", req.user._id));
  }

  const students = await Student.find({ parent: parent._id })
    .populate("class section stream bus_pick bus_drop bus_stop", "name")
    .populate("academic_year", "title")
    .lean();

  for (const student of students) {
    student.photo = `${process.env.DOMAIN}/uploads/student/${student.photo}`;
  }

  res.status(200).json({ ...parent, students });
});

// @desc    Assign parent to student
// @route   POST /api/parent/add-student
// @access  Private
const addStudent = asyncHandler(async (req, res) => {
  const admNo = req.body.adm_no;

  const query = { admission_no: admNo, school: req.school._id };

  if (!(await Student.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Id("Student", admNo));
  }

  const result = await Student.updateOne(query, {
    $set: { parent: req.user._id },
  });

  res.json(result);
});

// @desc    Get bus locations
// @route   POST /api/parent/bus/track
// @access  Private
const trackBus = asyncHandler(async (req, res) => {
  const school = req.school;
  const busId = req.body.bus;

  const results = [];

  if (busId) {
    const bus = await Bus.findById(busId)
      .select("name no_plate status device")
      .populate("device")
      .lean();

    const device = await UC.getBusDevice(bus);

    return res.status(200).json([
      {
        bus_name: bus.name,
        no_plate: bus.no_plate,
        status: {
          value: bus.status.value,
          dt: UC.formatDateTimeToAMPM(UC.convUTCTo0530(bus.status.dt)),
        },
        imei: device.imei,
        dt_server: UC.formatDateTimeToAMPM(UC.convUTCTo0530(device.dt_server)),
        dt_tracker: UC.formatDateTimeToAMPM(
          UC.convUTCTo0530(device.dt_tracker)
        ),
        lat: device.lat,
        lon: device.lon,
        speed: device.speed,
        altitude: device.altitude,
        angle: device.angle,
        vehicle_status: {
          last_stop: UC.formatDateTimeToAMPM(
            UC.convUTCTo0530(device.vehicle_status.last_stop)
          ),
          last_idle: UC.formatDateTimeToAMPM(
            UC.convUTCTo0530(device.vehicle_status.last_idle)
          ),
          last_move: UC.formatDateTimeToAMPM(
            UC.convUTCTo0530(device.vehicle_status.last_move)
          ),
          is_stopped: device.vehicle_status.is_stopped,
          is_idle: device.vehicle_status.is_idle,
          is_moving: device.vehicle_status.is_moving,
        },
        ignition: device.params.io239 === "1",
        icon: UC.getBusIcon(device),
      },
    ]);
  }

  const students = await Student.find({ parent: req.user._id })
    .select("_id admission_no name bus_pick bus_drop")
    .populate({
      path: "current_bus",
      select: "name no_plate status temp_device",
      populate: { path: "device" },
    })
    .lean();

  for (const stu of students) {
    const stuBus = isMorningTime(new Date(), school.morning_attendance_end)
      ? stu.bus_pick
      : stu.bus_drop;

    if (!stu.bus_drop && !stu.bus_pick) {
      results.push({
        student: {
          admission_no: stu.admission_no,
          name: stu.name,
        },
        msg: "Pedestrian",
      });

      continue;
    }

    // const busToFetch = stuBus.alternate.enabled
    //   ? stuBus.alternate.bus
    //   : stuBus._id;

    // const bus = await Bus.findById(busToFetch)
    //   .select("name no_plate status temp_device device")
    //   .populate("device")
    //   .lean();

    const bus = stu.current_bus;

    const device = await UC.getBusDevice(bus);

    results.push({
      student: {
        admission_no: stu.admission_no,
        name: stu.name,
      },
      bus_name: bus.name,
      no_plate: bus.no_plate,
      status: {
        value: bus.status.value,
        dt: UC.formatDateTimeToAMPM(UC.convUTCTo0530(bus.status.dt)),
      },
      imei: device.imei,
      dt_server: UC.formatDateTimeToAMPM(UC.convUTCTo0530(device.dt_server)),
      dt_tracker: UC.formatDateTimeToAMPM(UC.convUTCTo0530(device.dt_tracker)),
      lat: device.lat,
      lon: device.lon,
      speed: device.speed,
      altitude: device.altitude,
      angle: device.angle,
      vehicle_status: {
        last_stop: UC.formatDateTimeToAMPM(
          UC.convUTCTo0530(device.vehicle_status.last_stop)
        ),
        last_idle: UC.formatDateTimeToAMPM(
          UC.convUTCTo0530(device.vehicle_status.last_idle)
        ),
        last_move: UC.formatDateTimeToAMPM(
          UC.convUTCTo0530(device.vehicle_status.last_move)
        ),
        is_stopped: device.vehicle_status.is_stopped,
        is_idle: device.vehicle_status.is_idle,
        is_moving: device.vehicle_status.is_moving,
      },
      ignition: device.params?.io239 === "1",
      icon: UC.getBusIcon(device),
    });
  }

  res.status(200).json(results);
});

// @desc    Calculate student fee
// @route   POST /api/parent/fee/calculate
// @access  Private
const feeCalculate = asyncHandler(async (req, res) => {
  if (!req.body.adm_no) {
    res.status(400);
    throw new Error(C.getFieldIsReq("adm_no"));
  }

  const admNo = req.body.adm_no.toUpperCase();

  if (!req.students || req.students.length === 0) {
    return res.json({ msg: "Students not found!" });
  }

  if (!req.students.map((ele) => ele.admission_no).includes(admNo)) {
    res.status(400);
    throw new Error(C.getResourse404Id("Student", admNo));
  }

  const result = await FEE.calcStudentFees(admNo, req.ayear);

  const dueFees = FEE.combineFeesArrays(
    result.one_time_fees,
    result.term_fees,
    result.partial_fees
  );

  const paidFees = FEE.combineFeesArrays(
    result.paid_fees?.one_time_fees,
    result.paid_fees?.term_fees,
    result.paid_fees?.partial_fees
  );

  delete result.one_time_fees;
  delete result.term_fees;
  delete result.partial_fees;
  delete result.paid_fees;

  result.due_fees = dueFees;
  result.paid_fees = paidFees;

  return res.status(200).json(result);
});

// @desc    Pay student fee
// @route   POST /api/parent/fee/pay
// @access  Private
const feePayment = asyncHandler(async (req, res) => {
  if (!req.body.adm_no) {
    res.status(400);
    throw new Error(C.getFieldIsReq("adm_no"));
  }

  const admNo = req.body.adm_no.toUpperCase();

  if (!req.body.fees || !req.body.fees.length) {
    res.status(400);
    throw new Error(C.getFieldIsReq("fees"));
  }

  const [oneTimeFees, termFees, partialFees] = FEE.splitFeesArrays(
    req.body.fees
  );

  if (req.body.amount === undefined) {
    res.status(400);
    throw new Error(C.getFieldIsReq("amount"));
  }

  const amount = parseInt(req.body.amount);

  if (isNaN(amount)) {
    res.status(400);
    throw new Error(C.getFieldIsInvalid("amount"));
  }

  const fees = await FEE.getStudentFees(
    admNo,
    req.ayear,
    termFees,
    partialFees,
    oneTimeFees
  );

  if (amount !== fees.total_due_amount) {
    res.status(400);
    throw new Error(
      `Amount should be: ${fees.total_due_amount}, instead got: ${amount}.`
    );
  }

  // Initiate payment
  const student = fees.student;
  const orderName = `${req.school.name}: student fee payment`;
  const orderDesc = `Student: ${student.name} fee payment`;
  const order = await createStudentFeeOrder(
    orderName,
    orderDesc,
    student,
    amount
  );

  const rpPayment = await RazorpayFeePayment.create({
    order,
    student: student._id,
    paid_for: req.body.fees,
    total_amount: amount,
    academic_year: req.ayear,
  });

  res.status(200).json(order);
});

// @desc    Get student's bus attendance
// @route   POST /api/parent/attendance/bus
// @access  Private
const getStudentBusAttendance = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "-date";
  const search = req.query.search;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");

  const dates = UC.getDatesArrayFromDateRange(dtStart, dtEnd);

  const totalBusAttendances = [];

  if (!req.students) {
    res.status(400);
    throw new Error(`Linked students not found, email: ${req.user.email}`);
  }

  const query = { student: req.students.map((s) => s._id) };

  const tag = req.body.tag;
  if (tag) {
    if (tag === "total") {
    } else if (tag === "present") {
    } else if (tag === "absent") {
    } else if (tag === "mCheckIn") {
      query.list = { $elemMatch: { tag: C.M_ENTRY } };
    } else if (tag === "mCheckOut") {
      query.list = { $elemMatch: { tag: C.M_EXIT } };
    } else if (tag === "aCheckIn") {
      query.list = { $elemMatch: { tag: C.A_ENTRY } };
    } else if (tag === "aCheckOut") {
      query.list = { $elemMatch: { tag: C.A_EXIT } };
    } else if (tag === "mCheckInMissed") {
      query.list = { $not: { $elemMatch: { tag: C.M_ENTRY } } };
    } else if (tag === "mCheckOutMissed") {
      query.list = { $not: { $elemMatch: { tag: C.M_EXIT } } };
    } else if (tag === "aCheckInMissed") {
      query.list = { $not: { $elemMatch: { tag: C.A_ENTRY } } };
    } else if (tag === "aCheckOutMissed") {
      query.list = { $not: { $elemMatch: { tag: C.A_EXIT } } };
    } else if (tag === "inSchool") {
      query.list = {
        $elemMatch: { $or: [{ tag: C.M_ENTRY }, { tag: C.M_EXIT }] },
      };
    } else if (tag === "outSchool") {
      query.list = {
        $elemMatch: { $or: [{ tag: C.A_ENTRY }, { tag: C.A_EXIT }] },
      };
    } else if (tag === "inButNotOutSchool") {
      query.$and = [
        {
          list: {
            $elemMatch: { $or: [{ tag: C.M_ENTRY }, { tag: C.M_EXIT }] },
          },
        },
        {
          list: {
            $not: {
              $elemMatch: { $or: [{ tag: C.A_ENTRY }, { tag: C.A_EXIT }] },
            },
          },
        },
      ];
    } else if (tag === "wrongBus") {
    } else if (tag === "wrongStop") {
    } else {
      res.status(400);
      throw new Error("Invalid tag!");
    }
  }

  if (search) {
    const fields = ["list.tag", "list.address", "list.msg"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  for (const dt of dates) {
    query.date = dt;

    const busAttendances = await StuBusAtt.find(query)
      .populate({
        path: "student",
        select: "admission_no name class section photo",
        populate: { path: "class section", select: "name" },
      })
      .populate("bus", "name")
      .lean();

    const flattenedBusAtt = busAttendances.map((busAtt) => {
      const photo = busAtt.student.photo
        ? `${DOMAIN}/uploads/student/${busAtt.student.photo}`
        : `${DOMAIN}/user-blank.svg`;

      const flattenedData = {
        _id: busAtt._id,
        absent: false,
        date: UC.formatDate(busAtt.date),
        admission_no: busAtt.student.admission_no,
        student_name: busAtt.student.name,
        class_name: busAtt.student.class.name,
        section_name: busAtt.student.section.name,
        photo,
        last_bus: busAtt?.bus?.name,
      };

      busAtt.list.forEach((tagObj) => {
        const tagKey = tagObj.tag.toLowerCase();
        const tagName =
          tagObj.tag === C.M_ENTRY
            ? "Picked from Stoppage"
            : tagObj.tag === C.M_EXIT
            ? "Dropped at School"
            : tagObj.tag === C.A_ENTRY
            ? "Picked from School"
            : tagObj.tag === C.A_EXIT
            ? "Dropped at Stoppage"
            : C.UNKNOWN;

        flattenedData[`${tagKey}_tag`] = tagName;
        flattenedData[`${tagKey}_time`] = UC.convAndFormatDT(tagObj.time).slice(
          10
        );
        flattenedData[`${tagKey}_lat`] = tagObj.lat;
        flattenedData[`${tagKey}_lon`] = tagObj.lon;
        flattenedData[`${tagKey}_address`] = tagObj.address;
        flattenedData[`${tagKey}_msg`] = tagObj.msg;
      });

      return flattenedData;
    });

    const stuQuery = {
      _id: {
        $nin: busAttendances.map((ele) => ele.student._id),
        $in: req.students.map((ele) => ele._id),
      },
    };

    const absentStudents = await Student.find(stuQuery)
      .select("admission_no name")
      .populate("class section", "name")
      .lean();

    const absentBusAttendances = [];
    for (const abStu of absentStudents) {
      absentBusAttendances.push({
        absent: true,
        date: UC.convAndFormatDT(dt),
        admission_no: abStu.admission_no,
        student_name: abStu.name,
        class_name: abStu.class.name,
        section_name: abStu.section.name,
        photo: abStu.photo
          ? `${DOMAIN}/uploads/student/${abStu.photo}`
          : `${DOMAIN}/user-blank.svg`,
        mentry_tag: "NA",
        mentry_time: "NA",
        mentry_lat: 0,
        mentry_lon: 0,
        mentry_address: "NA",
        mentry_msg: "NA",
        mexit_tag: "NA",
        mexit_time: "NA",
        mexit_lat: 0,
        mexit_lon: 0,
        mexit_address: "NA",
        mexit_msg: "NA",
        aentry_tag: "NA",
        aentry_time: "NA",
        aentry_lat: 0,
        aentry_lon: 0,
        aentry_address: "NA",
        aentry_msg: "NA",
        aexit_tag: "NA",
        aexit_time: "NA",
        aexit_lat: 0,
        aexit_lon: 0,
        aexit_address: "NA",
        aexit_msg: "NA",
      });
    }

    if (!tag || tag === "total") {
      totalBusAttendances.push(...flattenedBusAtt, ...absentBusAttendances);
    } else if (tag === "absent") {
      totalBusAttendances.push(...absentBusAttendances);
    } else totalBusAttendances.push(...flattenedBusAtt);
  }

  const total = totalBusAttendances.length;
  const pages = Math.ceil(total / limit) || 1;
  if (page > pages) {
    return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  }

  const startIdx = (page - 1) * limit;
  const results = { total, pages, page, result: [] };

  results.result = totalBusAttendances
    .slice(startIdx, startIdx + limit)
    .sort((a, b) => {
      if (a[sort] > b[sort]) return 1;
      if (a[sort] < b[sort]) return -1;
      return 0;
    });

  /**
   *
   *
   *
   *
   */

  res.status(200).json(results);
});

// @desc    Get student's class attendance
// @route   POST /api/parent/attendance/class
// @access  Private
const getStudentClassAttendance = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "-date";
  const sord = req.query.sord_order || "asc";
  const search = req.query.search;

  if (!req.students) {
    res.status(400);
    throw new Error(`Linked students not found, email: ${req.user.email}`);
  }

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");

  const dates = UC.getDatesArrayFromDateRange(dtStart, dtEnd);

  const totalClassAttendances = [];

  const query = { student: req.students.map((s) => s._id) };

  const tag = req.body.tag;
  if (tag) {
    if (tag === "total") {
    } else if (tag === "present") {
    } else if (tag === "absent") {
    } else if (tag === "checkIn") {
      query.list = { $elemMatch: { tag: C.ENTRY } };
    } else if (tag === "checkOut") {
      query.list = { $elemMatch: { tag: C.EXIT } };
    } else if (tag === "checkInButNotOut") {
      query.list = {
        $elemMatch: { tag: C.ENTRY },
        $not: { $elemMatch: { tag: C.EXIT } },
      };
    } else if (tag === "checkInMissed") {
      query.list = { $not: { $elemMatch: { tag: C.ENTRY } } };
    } else if (tag === "checkOutMissed") {
      query.list = { $not: { $elemMatch: { tag: C.EXIT } } };
    } else {
      res.status(400);
      throw new Error("Invalid tag!");
    }
  }

  if (search) {
    const fields = ["list.tag", "list.msg"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  for (const dt of dates) {
    query.date = dt;

    const classAttendances = await StuClassAtt.find(query)
      .populate({
        path: "student",
        select: "admission_no name class section photo",
        populate: { path: "class section", select: "name" },
      })
      .lean();

    const flattenedClassAtt = classAttendances.map((item) => {
      const photo = item.student.photo
        ? `${DOMAIN}/uploads/student/${item.student.photo}`
        : `${DOMAIN}/user-blank.svg`;

      const flattenedData = {
        _id: item._id,
        absent: false,
        date: UC.formatDate(item.date),
        admission_no: item.student.admission_no,
        student_name: item.student.name,
        class_name: item.student.class.name,
        section_name: item.student.section.name,
        photo,
        last_bus: item?.bus?.name,
      };

      item.list.forEach((tagObj) => {
        const tagKey = tagObj.tag.toLowerCase();
        const tagName =
          tagObj.tag === C.ENTRY
            ? "Checked in to School"
            : tagObj.tag === C.EXIT
            ? "Checked out from School"
            : "Unknown";

        flattenedData[`${tagKey}_tag`] = tagName;
        flattenedData[`${tagKey}_time`] = UC.convAndFormatDT(tagObj.time).slice(
          10
        );
        flattenedData[`${tagKey}_msg`] = tagObj.msg;
        flattenedData[`${tagKey}_mark_as_absent`] = tagObj.mark_as_absent;
      });

      return flattenedData;
    });

    const stuQuery = {
      _id: {
        $nin: classAttendances.map((ele) => ele.student._id),
        $in: req.students.map((ele) => ele._id),
      },
    };

    const absentStudents = await Student.find(stuQuery)
      .select("admission_no name")
      .populate("class section", "name")
      .lean();

    const absentBusAttendances = [];
    for (const abStu of absentStudents) {
      absentBusAttendances.push({
        absent: true,
        date: UC.convAndFormatDT(dt),
        admission_no: abStu.admission_no,
        student_name: abStu.name,
        class_name: abStu.class.name,
        section_name: abStu.section.name,
        photo: abStu.photo
          ? `${DOMAIN}/uploads/student/${abStu.photo}`
          : `${DOMAIN}/user-blank.svg`,
        entry_tag: "NA",
        entry_time: "NA",
        entry_lat: 0,
        entry_lon: 0,
        entry_address: "NA",
        entry_msg: "NA",
        exit_tag: "NA",
        exit_time: "NA",
        exit_lat: 0,
        exit_lon: 0,
        exit_address: "NA",
        exit_msg: "NA",
      });
    }

    if (!tag || tag === "total") {
      totalClassAttendances.push(...flattenedClassAtt, ...absentBusAttendances);
    } else if (tag === "absent") {
      totalClassAttendances.push(...absentBusAttendances);
    } else totalClassAttendances.push(...flattenedClassAtt);
  }

  const sortFn =
    sord === "desc"
      ? (a, b) => {
          if (a[sort] > b[sort]) return -1;
          if (a[sort] < b[sort]) return 1;
          return 0;
        }

      : (a, b) => {
          if (a[sort] > b[sort]) return 1;
          if (a[sort] < b[sort]) return -1;
          return 0;
        };

  const results = UC.paginatedArrayQuery(
    totalClassAttendances,
    page,
    limit,
    sortFn
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get student's attendance count
// @route   POST /api/parent/student/attendance-count
// @access  Private
const getStudentAttendanceCount = asyncHandler(async (req, res) => {
  const dtStart = UC.validateAndSetDate(req.body.dt_start);
  const dtEnd = UC.validateAndSetDate(req.body.dt_end);

  // Validate no_of_holidays
  if (!req.body.no_of_holidays) {
    req.body.no_of_holidays = 0;
  }

  const noOfHolidays = req.body.no_of_holidays;

  if (isNaN(parseInt(noOfHolidays))) {
    res.status(400);
    throw new Error(C.getFieldIsInvalid("no_of_holidays"));
  }

  const dates = [];
  let cDate = new Date(dtStart);
  while (cDate <= dtEnd) {
    dates.push(cDate);
    cDate = new Date(cDate.getTime() + 86400000);
  }

  const students = await Student.find({ parent: req.user._id })
    .select("_id admission_no name photo")
    .lean();

  const result = [];

  for (const stu of students) {
    const count = { t: 0, p: 0, a: 0 };
    for (const date of dates) {
      const attendance = await StuBusAtt.findOne({ date, student: stu._id })
        .populate("student", "admission_no")
        .lean();

      if (!attendance) count.a += 1;
      else count.p += 1;
      count.t += 1;
    }

    count.a = count.a - noOfHolidays;
    count.t = count.t - noOfHolidays;

    result.push({
      admission_no: stu.admission_no,
      name: stu.name,
      photo: stu.photo || "/user-blank.svg",
      ...count,
    });
  }

  res.status(200).json(result);
});

// @desc    Get student's attendance notification
// @route   POST /api/parent/student/attendance-notification
// @access  Private
const getStudentAttendanceNotification = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "-date";
  const search = req.query.search;

  const dtStart = UC.validateAndSetDate(req.body.dt_start, "dt_start");
  const dtEnd = UC.validateAndSetDate(req.body.dt_end, "dt_end");

  const students = await Student.find({ parent: req.user._id })
    .select("_id admission_no name")
    .lean();

  const query = {
    date: { $gte: dtStart, $lte: dtEnd },
    student: students.map((s) => s._id),
    // sent: true,
  };

  if (search) {
    const fields = ["student.admission_no", "student.name", "student.email"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    StudentNotification,
    query,
    {},
    page,
    limit,
    sort,
    ["student bus", "admission_no name email"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get student's bus contact info
// @route   POST /api/parent/student/bus-contact-info
// @access  Private
const getStudentBusContactInfo = asyncHandler(async (req, res) => {
  const students = await Student.find({
    parent: req.user._id,
    school: req.school._id,
  })
    .select("_id admission_no name bus_pick bus_drop")
    .populate("current_bus bus_pick bus_drop")
    .lean();

  const results = [];

  for (const s of students) {
    const student = s._id;
    const academic_year = req.ayear;

    if (!(await BusAssignment.any({ student, academic_year }))) {
      results.push({
        student: { admission_no: s.admission_no, name: s.name },
        msg: "Bus not assigned!",
      });

      continue;
    }

    const stuBus = isMorningTime(new Date(), req.school.morning_attendance_end)
      ? s.bus_pick
      : s.bus_drop;

    const bus = await Bus.findById(stuBus)
      .select("name driver conductor")
      .populate("driver conductor", "name email phone")
      .lean();

    if (!bus) {
      res.status(404);
      throw new Error(`Student bus not found: ${stuBus}!`);
    }

    results.push({
      student: { admission_no: s.admission_no, name: s.name },
      bus: bus.name,
      bus_incharge: req.school.bus_incharge,
      driver: {
        name: bus.driver.name,
        email: bus.driver.email,
        phone: bus.driver.phone,
      },
      conductor: {
        name: bus.conductor.name,
        email: bus.conductor.email,
        phone: bus.conductor.phone,
      },
    });
  }

  res.status(200).json(results);
});

// @desc    Get attendance calendar
// @route   POST /api/parent/student/attendance-calendar
// @access  Private
const getStudentAttendanceCalendar = asyncHandler(async (req, res) => {
  const studentId = req.body.student;

  if (!studentId) {
    res.status(400);
    throw new Error(C.getFieldIsReq("student"));
  }

  if (!(await Student.any({ _id: studentId, parent: req.user._id }))) {
    res.status(400);
    throw new Error(C.getResourse404Id("student", studentId));
  }

  if (!req.body.month) {
    res.status(400);
    throw new Error(C.getFieldIsReq("month"));
  }

  const month = parseInt(req.body.month);

  if (isNaN(month)) {
    res.status(400);
    throw new Error(C.getFieldIsInvalid("month"));
  }

  const now = new Date(new Date().setUTCHours(0, 0, 0, 0));
  const dtStart = new Date(new Date(now.setMonth(month - 1)).setDate(1));
  const dtEnd = new Date(new Date(now.setMonth(month)).setDate(0));

  const student = await Student.findById(studentId)
    .select("_id admission_no name")
    .lean();

  const query = {
    date: { $gte: dtStart, $lte: dtEnd },
    student: student._id,
  };

  const attendances = await StuBusAtt.find(query).lean();

  const result = [];
  const lastDate = dtEnd.getUTCDate();

  const week = [];
  for (let d = 1; d <= lastDate; d++) {
    const currDate = new Date(new Date(dtStart).setUTCDate(d));

    const att = attendances.find(
      (att) => att.date.getTime() === currDate.getTime()
    );

    if (att) {
      week.push({ date: currDate, attendance: "Present" });
    } else week.push({ date: currDate, attendance: "Absent" });

    if (d % 7 === 0) {
      const week_ = [...week];
      result.push(week_);
      week.splice(0, week.length);
    }
  }

  if (week.length > 0) result.push(week);

  res.status(200).json(result);
});

// @desc    Get school notices
// @route   GET /api/parent/notice
// @access  Private
const getSchoolNotices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "-createdAt";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["name"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    Notice,
    query,
    "title publish_date",
    page,
    limit,
    sort
  );

  for (const notice of results.result) {
    notice.file = `${process.env.DOMAIN}/uploads/notice/${notice.file}`;

    const seen = await NoticeSeen.findOne({
      notice: notice._id,
      seens: req.user._id,
    })
      .select("_id")
      .lean();

    if (seen) notice.seen = true;
    else notice.seen = false;
  }

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get school notices
// @route   GET /api/parent/notice/:id
// @access  Private
const getSchoolNotice = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const notice = await Notice.findOne(query).lean();

  notice.file = `${process.env.DOMAIN}/uploads/notice/${notice.file}`;

  const isSeen = await NoticeSeen.any({
    notice: notice._id,
    seens: req.user._id,
  });

  if (!isSeen) {
    if (!(await NoticeSeen.any({ notice: notice._id }))) {
      await NoticeSeen.create({
        notice: notice._id,
        seens: [req.user._id],
      });
    } else {
      await NoticeSeen.updateOne(
        { notice: notice._id },
        { $push: { seens: req.user._id } }
      );
    }
  }

  res.status(200).json(notice);
});

// @desc   get homework submission
// @route  GET api/parent/homework/submission/:id
// @access private
const getHomeWorkSubmission = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const homeworkSubmission = await HomeworkSubmission.findOne(query).lean();

  if (!homeworkSubmission) {
    res.status(404);
    throw new Error(C.getResourse404Id("homeworkSubmission", req.params.id));
  }

  res.status(200).json(homeworkSubmission);
});

// @desc   get homework submissions
// @route  POST api/parent/homework/submission
// @access private
const getHomeworkSubmissions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "homework_date";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["homework", "student"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    HomeworkSubmission,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) {
    return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });
  }

  res.status(200).json(results);
});

// @desc   Add homework submission
// @route  POST api/parent/homework/submission
// @access private
const addHomeworkSubmission = asyncHandler(async (req, res) => {
  if (!req.body.adm_no) {
    res.status(400);
    throw new Error(C.getFieldIsReq("adm_no"));
  }

  const homework = await UC.validateHomeworkById(req.body.homework, req.ayear);
  const student = await Student.findOne({ admission_no: req.body.adm_no })
    .select("_id")
    .lean();

  if (!student) {
    res.status(400);
    throw new Error(C.getResourse404Id("Student", req.body.adm_no));
  }

  const doc = req.file ? req.file.filename : " ";

  const submission = await HomeworkSubmission.create({
    student: student._id,
    homework,
    file: doc,
  });

  res.status(201).json({ msg: submission._id });
});

// @desc    Update homework submission
// @route   Patch api/parent/homework/evaluation/:id
// @access  Private
const updateHomeworkSubmission = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await HomeworkSubmission.any(query))) {
    res.status(404);
    throw new Error(C.getResource404Error("HomeworkSubmission", req.params.id));
  }

  const updatedSumission = await HomeworkSubmission.updateOne(query, {
    $set: {
      file: req.body.file,
    },
  });

  res.status(200).json(updatedSumission);
});

//@desc delete  homework submission
//@route DELETE api/parent/homework/evaluation/:id
//@access private
const deleteHomeworkSubmission = asyncHandler(async (req, res) => {
  const submission = HomeworkSubmission.findById(req.params.id)
    .select("_id")
    .lean();
  if (!submission) {
    res.status(400);
    throw new Error(C.getResourse404Error("submission", req.params.id));
  }

  const delQuery = { _id: req.params.id };

  const deletedSubmission = await HomeworkSubmission.deleteOne(delQuery);
  res.status(200).json(deletedSubmission);
});

module.exports = {
  getParentAccountInfo,
  addStudent,
  trackBus,
  feeCalculate,
  feePayment,
  getStudentBusAttendance,
  getStudentClassAttendance,
  getStudentAttendanceCount,
  getStudentAttendanceNotification,
  getStudentBusContactInfo,
  getStudentAttendanceCalendar,

  getSchoolNotices,
  getSchoolNotice,

  getHomeworkSubmissions,
  getHomeWorkSubmission,
  addHomeworkSubmission,
  updateHomeworkSubmission,
  deleteHomeworkSubmission,
};
