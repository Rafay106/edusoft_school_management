const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const UC = require("../utils/common");
const fs = require("node:fs");
const path = require("node:path");
const RazorpayPayment = require("../models/fees/razorPayModel");
const { bulkImportUpload } = require("../middlewares/multerMiddleware");
const BusStaff = require("../models/transport/busStaffModel");
const BusStop = require("../models/transport/busStopModel");
const Bus = require("../models/transport/busModel");
const XLSX = require("xlsx");
const Student = require("../models/studentInfo/studentModel");
const { default: mongoose } = require("mongoose");
const Class = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const BoardingType = require("../models/studentInfo/boardingTypeModel");
const SubWard = require("../models/studentInfo/subwardTypeModel");
const User = require("../models/system/userModel");
const FeeTerm = require("../models/fees/feeTermModel");
const FeeType = require("../models/fees/feeTypeModel");

router.post(
  "/1",
  asyncHandler(async (req, res) => {
    const orders = [
      "order_Nw1WoYnr7K8aEe",
      "order_Nw1YPdVxzvQPAq",
      "order_Nw1arojN0akhko",
      "order_Nw1cSXRc72bAQJ",
      "order_Nw1fRc3K1hmNbg",
      "order_Nw1h1XMnO0r1OP",
      "order_Nw1ja0n6sDmtPj",
      "order_Nw1kmLcqmaKNmT",
      "order_Nw1mjZev9kr7dL",
      "order_Nw1on3v7DAYKYb",
    ];

    const result = await RazorpayPayment.find({ "order.id": orders });

    res.json(result);
  })
);

router.post(
  "/2",
  bulkImportUpload.single("file"),
  asyncHandler(async (req, res) => {
    const filePath = path.join("data", "imports", req.file.filename);
    const fileData = UC.excelToJson(filePath);
    fs.unlinkSync(filePath);

    const baseDate = new Date("30-12-1899T00:00:00Z");

    const classes = await Class.find().lean();
    const sections = await Section.find().lean();
    const boardingTypes = await BoardingType.find().lean();
    const subwards = await SubWard.find().lean();
    const buses = await Bus.find().lean();
    const busStops = await BusStop.find().lean();

    const studentTransportDetails = UC.excelToJson(
      path.join("data", "Student-Transport-Detail.xlsx")
    );

    const students = [];
    let i = 1;

    for (const row of fileData) {
      if (row.phone) {
        row.phone = row.phone.toString().replace("+91", "").replaceAll(" ", "");
      }

      let class_ = classes.find((c) => c.name === row.class);
      if (!class_) {
        class_ = classes.find((c) => c.name === "NA");
      }

      let section = sections.find((s) => s.name === row.section);
      if (!section) {
        section = sections.find((s) => s.name === "NA");
      }

      let atclass = classes.find((c) => c.name === row.admission_time_class);
      if (!atclass) {
        atclass = classes.find((c) => c.name === "NA");
      }

      let boardingType = boardingTypes.find(
        (bt) => bt.name === row.boarding_type
      );

      if (!boardingType) {
        boardingType = boardingTypes.find((bt) => bt.name === "NA");
      }

      let subward = subwards.find((sw) => sw.name === row.sub_ward);

      if (!subward) {
        subward = subwards.find((sw) => sw.name === "NA");
      }

      const stuTD = studentTransportDetails.find(
        (std) => std.admno === row.admission_no
      );

      const bus_pick = stuTD
        ? buses.find((b) => b.name === stuTD.busp)
        : undefined;

      const bus_drop = stuTD
        ? buses.find((b) => b.name === stuTD.busd)
        : undefined;

      const busStop = busStops.find((bs) => bs.name === row.bus_stop);

      const student = {
        admission_no: row.admission_no,
        admission_serial: row.admission_serial,
        student_id: row.student_id,
        roll_no: row.roll_no,
        name: row.name,
        class: class_._id,
        section: section._id,
        stream: row.stream,
        admission_time_class: atclass._id,
        gender: !row.gender ? "na" : row.gender === "MALE" ? "m" : "f",
        house: row.house,
        blood_group: row.blood_group,
        staff_child: row.staff_child,
        doa: new Date((row.doa - 25569) * 86400 * 1000),
        student_status: row.student_status === "New" ? "n" : "o",
        student_left: row.student_left === "Yes",
        phone: row.phone ? row.phone : "9123123123",
        father_details: {
          name: row.father_name,
          phone: row.father_phone,
          designation: row.father_designation,
          office_address: row.father_office,
          job_title: row.father_job,
          adhaar: row.father_adhaar,
        },
        mother_details: {
          name: row.mother_name,
          phone: row.mother_phone,
          job_title: row.mother_job,
          adhaar: row.mother_adhaar,
        },
        dob: new Date((row.dob - 25569) * 86400 * 1000),
        age: row.age,
        address: {
          permanent: row.permanent_address,
          correspondence: row.correspondence_address,
        },
        religion: row.religion,
        cast: row.cast === "GENERAL" ? "GEN" : row.cast,
        boarding_type: boardingType._id,
        sub_ward: subward._id,
        student_club: row.student_club,
        student_work_exp: row.student_work_exp,
        language_2nd: row.language_2nd,
        language_3rd: row.language_3rd,
        exam_subjects: {
          one: row.exam_sub1,
          two: row.exam_sub2,
          three: row.exam_sub3,
          four: row.exam_sub4,
          five: row.exam_sub5,
          six: row.exam_sub6,
          seven: row.exam_sub7,
          eigth: row.exam_sub8,
          nine: row.exam_sub9,
          ten: row.exam_sub10,
        },
        ews_applicable: row.ews_applicable === "Yes",
        bank_details: {
          name: row.bankname,
          account_type: row.account_type,
          account_holder: row.account_holder,
          account_no: row.account_no,
          ifsc: row.ifsc,
        },
        relation_with_student: row.relation_with_student,
        class_teacher: row.class_teacher,
        bus_pick: bus_pick ? bus_pick._id : undefined,
        bus_drop: bus_drop ? bus_drop._id : undefined,
        bus_stop: busStop ? busStop._id : undefined,
        student_adhaar: row.student_adhaar,
        sibling: row.sibling === "Yes",
        single_girl_child: row.single_girl_child === "Yes",
        handicapped: row.handicapped === "Yes",
        email:
          row.admission_no.replace("/", "") +
          // UC.getPersonName(name).replaceAll(" ", "") +
          "@email.com",
        photo: row.admission_no.replace("/", "") + ".jpg",
        rfid: i++,
        academic_year: "662cbaae728ab3280e780e84",
        school: "662c385ecfa060f7e1b9a1ec",
        manager: "662c364427e8f09bdec1f3c0",
      };

      students.push(student);
    }

    const student = await Student.create(students);

    res.json(student);
  })
);

router.post(
  "/3",
  asyncHandler(async (req, res) => {
    const parents = await User.find({ type: "parent" }).select("phone").lean();

    for (const parent of parents) {
      await Student.updateMany(
        { phone: parent.phone },
        { $set: { parent: parent._id } }
      );
    }

    res.json({ msg: "success" });
  })
);

router.post(
  "/4",
  bulkImportUpload.single("file"),
  asyncHandler(async (req, res) => {
    res.json({ msg: "OK" });
  })
);

module.exports = router;
