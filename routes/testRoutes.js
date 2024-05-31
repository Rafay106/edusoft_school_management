const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const UC = require("../utils/common");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
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
const Stream = require("../models/academics/streamModel");
const { isEmailValid } = require("../utils/validators");

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
    const fileData = UC.excelToJson(req.file.path);
    fs.unlinkSync(req.file.path);

    const baseDate = new Date("30-12-1899T00:00:00Z");

    const classes = await Class.find().lean();
    const sections = await Section.find().lean();
    const streams = await Stream.find().lean();
    const boardingTypes = await BoardingType.find().lean();
    const subwards = await SubWard.find().lean();
    const buses = await Bus.find().lean();
    const busStops = await BusStop.find().lean();

    const students = [];
    let i = 1;
    for (const row of fileData) {
      if (!row["Admission No"]) {
        res.status(400);
        throw new Error("Admission No not found at row: " + i);
      }

      if (row["Mobile No."]) {
        row["Mobile No."] = row["Mobile No."]
          .toString()
          .replace("+91", "")
          .replaceAll(" ", "");
      }

      let class_ = classes.find((c) => c.name === row["Class"]);
      if (!class_) {
        class_ = classes.find((c) => c.name === "NA");
      }

      let section = sections.find((s) => s.name === row["Sec"]);
      if (!section) {
        section = sections.find((s) => s.name === "NA");
      }

      const stream = streams.find((s) => s.name === "NA");

      let atclass = classes.find((c) => c.name === row["Adm. Class"]);
      if (!atclass) {
        atclass = classes.find((c) => c.name === "NA");
      }

      let boardingType = boardingTypes.find((bt) => bt.name === "NA");

      let subward = subwards.find((sw) => sw.name === "NA");

      const bus_pick = buses.find((b) => b.name === String(row["Bus No."]));

      const bus_drop = buses.find((b) => b.name === String(row["Bus No."]));

      const busStop = busStops.find((bs) => bs.name === row["Stoppage"]);

      const email =
        row["Email ID"] == "N/A" || !row["Email ID"]
          ? row["Admission No"].replace("/", "") + "@email.com"
          : row["Email ID"];

      if (!isEmailValid(email)) {
        res.status(400);
        throw new Error(`Invalid email: ${email}`);
      }

      const doa = new Date(row["Adm. Date"] + "T00:00:00Z");
      if (isNaN(doa)) {
        console.log(i);
        console.log(row["Adm. Date"] + "T00:00:00Z");
      }

      let address = row["Address"];

      if (!address.toLowerCase().includes("ranchi")) {
        address = address + ", RANCHI";
      }

      const student = {
        admission_no: row["Admission No"],
        admission_serial: row.admission_serial,
        student_id: row.student_id,
        roll_no: row["Roll No."],
        name: row["Student Name"],
        class: class_._id,
        section: section._id,
        stream: stream._id,
        admission_time_class: atclass._id,
        gender: !row["Gender"] ? "na" : row["Gender"] === "MALE" ? "m" : "f",
        house: row["House"],
        blood_group: row["Blood Group"] == "NONE" ? "na" : row["Blood Group"],
        staff_child: row.staff_child,
        doa,
        student_status: row.student_status === "New" ? "n" : "o",
        student_left: row.student_left === "Yes",
        phone: row["Mobile No."] ? row["Mobile No."] : "9123123123",
        father_details: {
          name: row["Father Name"],
          phone: row.father_phone,
          designation: row.father_designation,
          office_address: row.father_office,
          job_title: row.father_job,
          adhaar: row.father_adhaar,
        },
        mother_details: {
          name: row["Mother Name"],
          phone: row.mother_phone,
          job_title: row.mother_job,
          adhaar: row.mother_adhaar,
        },
        dob: new Date(row["Date of Birth"] + "T00:00:00Z"),
        age: row.age,
        address: {
          permanent: address,
          correspondence: address,
        },
        religion: row["Religion"],
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
        student_adhaar: row["Aadhaar Card No."],
        sibling: row.sibling === "Yes",
        single_girl_child: row.single_girl_child === "Yes",
        handicapped: row.handicapped === "Yes",
        email,
        photo: row["Admission No"].replace("/", "") + ".jpg",
        rfid: crypto.randomBytes(10).toString("hex"),
        academic_year: "664dc3cb044fbd5fd1e67332",
        school: "664dc175e6ef06e8a50ff69b",
      };

      students.push(student);

      i++;
    }

    for (const stuData of students) {
      if (await Student.any({ admission_no: stuData.admission_no })) {
        await Student.updateOne(
          { admission_no: stuData.admission_no },
          { $set: stuData }
        );
      } else await Student.create(stuData);
    }

    res.json(students);
  })
);

router.post(
  "/3",
  asyncHandler(async (req, res) => {
    const ftp = require("basic-ftp");
    const {
      MONGO_URI,
      NAME,
      DB_BACKUP_EMAIL,
      DB_BACKUP_FTP_UPLOAD,
      FTP_HOST,
      FTP_USER,
      FTP_PASS,
      FTP_BACKUP_DIR,
    } = process.env;
    const client = new ftp.Client();

    try {
      const x = await client.access({
        host: FTP_HOST,
        user: FTP_USER,
        password: FTP_PASS,
        secure: false,
      });

      const localFilePath = path.join("backup", FILE_NAME);

      const result = await client.uploadFrom(
        localFilePath,
        FTP_BACKUP_DIR + FILE_NAME
      );

      isUploadedToFTP = true;
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      client.close();
    }
    res.send("OK");
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
