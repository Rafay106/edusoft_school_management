const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const UC = require("../utils/common");
const C = require("../constants");
const RazorpayFeePayment = require("../models/fees/razorpayFeePaymentModel");
const { upload, uploadExcel } = require("../middlewares/multerMiddleware");
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
const School = require("../models/system/schoolModel");
const uploadPaths = require("../config/uploadPaths");
const Device = require("../models/system/deviceModel");
const { authenticate } = require("../middlewares/authMiddleware");
const Role = require("../models/system/roleModel");
const StuBusAtt = require("../models/attendance/studentBusAttendanceModel");
const StuClassAtt = require("../models/attendance/studentClassAttendanceModel");
const StudentNotification = require("../models/studentInfo/studentNotificationModel");
const FEE = require("../utils/fees");
const FeePaid = require("../models/fees/feePaidModel");
const LEDGER = require("../services/ledger");
const ManualFeePayment = require("../models/fees/manualFeePaymentModel");
const BusAssignment = require("../models/transport/busAssignModel");

// RFID verification routes

router.get(
  "/get-student-from-rfid",
  asyncHandler(async (req, res) => {
    const fileData = fs.readFileSync("./latest_scanned_rfid.txt", "utf-8");

    const student = await Student.findOne({ rfid: fileData }).lean();

    if (!student) {
      return res.status(200).json({
        success: false,
        body: `No student found with rfid: ${fileData}!`,
      });
    }

    res.status(200).json({ success: true, body: student });
  })
);

router.post(
  "/veirfy-student-rfid",
  asyncHandler(async (req, res) => {
    const rfid = req.body.rfid;

    if (!rfid) {
      res.status(400);
      throw new Error(C.getFieldIsReq("rfid"));
    }

    const student = await Student.findOne({ rfid }).lean();

    if (!student) {
      return res.status(200).json({
        success: false,
        body: `No student found with rfid: ${rfid}!`,
      });
    }

    await Student.updateOne({ rfid }, { $set: { rfid_verified: true } });

    res.status(200).json({ success: true, body: "OK" });
  })
);

router.post(
  "/update-student-rfid",
  asyncHandler(async (req, res) => {
    const rfid = req.body.rfid;
    const admno = req.body.adm_no;

    if (!rfid) {
      res.status(400);
      throw new Error(C.getFieldIsReq("rfid"));
    }

    if (!admno) {
      res.status(400);
      throw new Error(C.getFieldIsReq("adm_no"));
    }

    const student = await Student.findOne({
      admission_no: admno.toUpperCase(),
    }).lean();

    if (!student) {
      return res.status(200).json({
        success: false,
        body: `No student found with admission_no: ${admno}!`,
      });
    }

    await Student.updateOne(
      { rfid },
      { $set: { rfid: crypto.randomBytes(10).toString("hex") } }
    );

    await Student.updateOne(
      { admission_no: admno.toUpperCase() },
      { $set: { rfid, rfid_verified: true } }
    );

    res.status(200).json({ success: true, body: "OK" });
  })
);

// Test routes

router.post(
  "/1",
  asyncHandler(async (req, res) => {
    const file1 = path.join("data", "imports", "bus_assing.xlsx");
    const file2 = path.join("data", "imports", "FEES_COMPLETE.xlsx");

    const assignData = UC.excelToJson(file1);
    const feeData = UC.excelToJson(file2);

    // const busAssigns = await BusAssignment.find().lean();

    const result = [];
    const errors = [];

    let i = 2;
    for (const row of assignData) {
      const admNo = row["ADM.NO"];
      const bus_stop = row["BUS STOPPAGE"];

      const stuFeeData = feeData.find((ele) => ele["ADMISSION_NO"] === admNo);

      if (!stuFeeData) {
        errors.push(`Student not found in feeData: ${admNo}`);
        i++;
        continue;
      }

      const busFee = stuFeeData?.BUS_FEE;

      const stopName = bus_stop.trim().toUpperCase();
      const busStop = await BusStop.findOne({
        $or: [
          { name: stopName },
          { name: { $regex: stopName, $options: "i" } },
        ],
      }).lean();

      if (!busStop) {
        const msg = `BUS STOPPAGE: '${bus_stop}' not found! Row: ${i} | ${admNo} | ${busFee}`;
        errors.push(msg);
      } else if (busFee !== busStop.monthly_charges) {
        const msg = `Student Wrong Fee at row: ${i} | ${admNo} | ${busStop.name} | BF: ${busFee} - SC: ${busStop.monthly_charges}`;
        errors.push(msg);
      }

      i++;
    }

    res.json(errors.sort());
  })
);

router.post(
  "/2",
  authenticate,
  upload(uploadPaths.bulk_import).single("file"),
  asyncHandler(async (req, res) => {
    const file1 = path.join(
      "data",
      "imports",
      "Student_Profile_Detail_Report.xlsx"
    );
    const file2 = path.join("data", "imports", "Student List 23-24.xlsx");
    const file3 = path.join(
      "data",
      "imports",
      "consolidated student data.xlsx"
    );

    const file1Data = UC.excelToJson(file1);
    const file2Data = UC.excelToJson(file2);
    const file3Data = UC.excelToJson(file3);

    const classes = await Class.find().lean();
    const sections = await Section.find().lean();
    const streams = await Stream.find().lean();
    const boardingTypes = await BoardingType.find().lean();
    const subwards = await SubWard.find().lean();
    const buses = await Bus.find().lean();
    const busStops = await BusStop.find().lean();

    const naBoarding = boardingTypes.find((ele) => ele.name === "NA");
    const naSubward = subwards.find((ele) => ele.name === "NA");
    const naStream = streams.find((ele) => ele.name === "NA");

    const studentsRaw = [];
    const duplicate = [];
    let i = 1;

    for (const row of file2Data) {
      const activeStudent = file1Data.find(
        (ele) => ele["Enrollment No."] === row["Admission No."]
      );

      if (activeStudent) {
        const class_ = classes.find(
          (ele) => ele.name === activeStudent["Class"].toUpperCase()
        );

        if (!class_) {
          throw new Error(`Class not found: '${activeStudent["Class"]}'`);
        }

        const section = sections.find(
          (ele) => ele.name === activeStudent["Section"].toUpperCase()
        );

        if (!section) {
          throw new Error(`Section not found: '${activeStudent["Section"]}'`);
        }

        let gender = "na";
        if (row["Gender"] === "MALE") gender = "m";
        else if (row["Gender"] === "FEMALE") gender = "f";

        const doaRaw = row["Date of Admission"];
        const doa =
          typeof doaRaw === "number"
            ? new Date(UC.excelDateToJSDate(doaRaw))
            : new Date(doaRaw);

        const fadRaw = row["Fee Applicable Date"];
        const feeApplicable =
          typeof fadRaw === "number"
            ? new Date(UC.excelDateToJSDate(fadRaw))
            : new Date(fadRaw);

        if (isNaN(feeApplicable)) {
          continue;
          throw new Error(`Invalid Fee Applicable Date at row: ${i}`);
        }

        let student_status = "o";
        if (feeApplicable.getUTCFullYear() === 2024) student_status = "n";

        const dobRaw = activeStudent["Date of Birth"];
        const dob =
          typeof dobRaw === "number"
            ? new Date(UC.excelDateToJSDate(dobRaw))
            : new Date(dobRaw);

        const age = isNaN(dob)
          ? 0
          : new Date().getUTCFullYear() - dob.getUTCFullYear();

        const email = row["Email Id"];
        if (!isEmailValid(email)) {
          throw new Error(`Invalid email '${email}' at row: ${i}`);
        }

        const student = {
          admission_no: activeStudent["Enrollment No."],
          admission_serial: row["Registration No."],
          student_id: "",
          roll_no: row["Roll No."],
          name: activeStudent["Student Name"],
          class: class_._id,
          section: section._id,
          stream: naStream._id,
          gender,
          house: activeStudent["House"],
          blood_group: row["Blood Group"],
          doa: isNaN(doa) ? new Date(0) : doa,
          student_status,
          phone: activeStudent["Mobile Number"] || "1111111111",
          father_details: {
            name: row["Father Salutation"] + row["Father Name"],
            phone: row["Father Ph No."],
            designation: row["Father Profession"],
            office_address:
              row["Father Office Name"] + row["Father Office Address"],
            job_title: row["Father Department"],
            adhaar: row["Father Adhaar Card No"],
          },
          mother_details: {
            name: row["Mother Salutation"] + row["Mother Name"],
            phone: row["Mother Phone No."],
            job_title: row["Mother Designation"],
            adhaar: row["Mother Adhaar Card No"],
          },
          dob: isNaN(dob) ? new Date(0) : dob,
          age,
          address: {
            permanent: `${row["Address"]?.replaceAll(row["City"])} ${
              row["City"]
            } - ${row["Pincode"]}`,
            correspondence: `${row["Address"]?.replaceAll(row["City"])} ${
              row["City"]
            } - ${row["Pincode"]}`,
          },
          religion: row["Religion"],
          cast: row["Category"],
          boarding_type: naBoarding._id,
          sub_ward: naSubward._id,
          student_adhaar: row["Student Adhaar No"],
          email,
          photo: activeStudent["Enrollment No."].replaceAll("/", "_"),
          rfid: crypto.randomBytes(10).toString("hex"),
          academic_year: req.ayear,
          school: req.school._id,
        };

        const stopName = row["Stoppage"];
        if (stopName) {
          const stop = busStops.find((ele) => ele.name === stopName);
          if (stop) {
            student.bus_stop = stop._id;
          }
        }

        const dupStu = studentsRaw.find(
          (ele) => ele.admission_no === student.admission_no
        );

        if (!dupStu) {
          studentsRaw.push(student);
        } else duplicate.push(dupStu);
      }

      i++;
    }

    i = 1;
    for (const row of file3Data) {
      const activeStudent = file1Data.find(
        (ele) => ele["Enrollment No."] === row["Admission No."]
      );

      if (activeStudent) {
        const class_ = classes.find(
          (ele) => ele.name === activeStudent["Class"].toUpperCase()
        );

        if (!class_) {
          throw new Error(`Class not found: '${activeStudent["Class"]}'`);
        }

        const section = sections.find(
          (ele) => ele.name === activeStudent["Section"].toUpperCase()
        );

        if (!section) {
          throw new Error(`Section not found: '${activeStudent["Section"]}'`);
        }

        let gender = "na";
        if (row["Gender"] === "MALE") gender = "m";
        else if (row["Gender"] === "FEMALE") gender = "f";

        const doaRaw = row["Date of Admission"];
        const doa =
          typeof doaRaw === "number"
            ? new Date(UC.excelDateToJSDate(doaRaw))
            : new Date(doaRaw);

        const fadRaw = row["Fee Applicable Date"];
        const feeApplicable =
          typeof fadRaw === "number"
            ? new Date(UC.excelDateToJSDate(fadRaw))
            : new Date(fadRaw);

        if (isNaN(feeApplicable)) {
          continue;
          throw new Error(`Invalid Fee Applicable Date at row: ${i}`);
        }

        let student_status = "o";
        if (feeApplicable.getUTCFullYear() === 2024) student_status = "n";

        const dobRaw = activeStudent["Date of Birth"];
        const dob =
          typeof dobRaw === "number"
            ? new Date(UC.excelDateToJSDate(dobRaw))
            : new Date(dobRaw);

        const age = isNaN(dob)
          ? 0
          : new Date().getUTCFullYear() - dob.getUTCFullYear();

        const email = row["Email Id"];
        if (!isEmailValid(email)) {
          throw new Error(`Invalid email '${email}' at row: ${i}`);
        }

        const student = {
          admission_no: activeStudent["Enrollment No."],
          admission_serial: row["Registration No."],
          student_id: "",
          roll_no: row["Roll No."],
          name: activeStudent["Student Name"],
          class: class_._id,
          section: section._id,
          stream: naStream._id,
          gender,
          house: activeStudent["House"],
          blood_group: row["Blood Group"],
          doa: isNaN(doa) ? new Date(0) : doa,
          student_status,
          phone: activeStudent["Mobile Number"] || "1111111111",
          father_details: {
            name: row["Father Salutation"] + row["Father Name"],
            phone: row["Father Ph No."],
            designation: row["Father Profession"],
            office_address:
              row["Father Office Name"] + row["Father Office Address"],
            job_title: row["Father Department"],
            adhaar: row["Father Adhaar Card No"],
          },
          mother_details: {
            name: row["Mother Salutation"] + row["Mother Name"],
            phone: row["Mother Phone No."],
            job_title: row["Mother Designation"],
            adhaar: row["Mother Adhaar Card No"],
          },
          dob: isNaN(dob) ? new Date(0) : dob,
          age,
          address: {
            permanent: `${row["Address"]?.replaceAll(row["City"])} ${
              row["City"]
            } - ${row["Pincode"]}`,
            correspondence: `${row["Address"]?.replaceAll(row["City"])} ${
              row["City"]
            } - ${row["Pincode"]}`,
          },
          religion: row["Religion"],
          cast: row["Category"],
          boarding_type: naBoarding._id,
          sub_ward: naSubward._id,
          student_adhaar: row["Student Adhaar No"],
          email,
          photo: activeStudent["Enrollment No."].replaceAll("/", "_"),
          rfid: crypto.randomBytes(10).toString("hex"),
          academic_year: req.ayear,
          school: req.school._id,
        };

        const stopName = row["Stoppage"];
        if (stopName) {
          const stop = busStops.find((ele) => ele.name === stopName);
          if (stop) {
            student.bus_stop = stop._id;
          }
        }

        const dupStu = studentsRaw.find(
          (ele) => ele.admission_no === student.admission_no
        );

        if (!dupStu) {
          studentsRaw.push(student);
        } else duplicate.push(dupStu);
      }

      i++;
    }

    for (const stuData of studentsRaw) {
      if (await Student.any({ admission_no: stuData.admission_no })) {
        await Student.updateOne(
          { admission_no: stuData.admission_no },
          { $set: stuData }
        );
      } else await Student.create(stuData);
    }

    res.json({
      total: studentsRaw.length,
      students: studentsRaw,
      total_dup: duplicate.length,
      students_dup: duplicate,
    });
  })
);

function convertDateString(dateString) {
  // Split the date string into parts
  const [day, month, year] = dateString.split("-");

  // Return the new date string in YYYY-MM-DD format
  return `${year}-${month}-${day}`;
}

router.post(
  "/2-v2",
  authenticate,
  upload(uploadPaths.bulk_import).single("file"),
  asyncHandler(async (req, res) => {
    const file3 = path.join(
      "data",
      "imports",
      "consolidated student data.xlsx"
    );

    const file3Data = UC.excelToJson(file3);

    const classes = await Class.find().lean();
    const sections = await Section.find().lean();
    const streams = await Stream.find().lean();
    const boardingTypes = await BoardingType.find().lean();
    const subwards = await SubWard.find().lean();
    const buses = await Bus.find().lean();
    const busStops = await BusStop.find().lean();

    const naClass = classes.find((ele) => ele.name === "NA");
    const naSection = sections.find((ele) => ele.name === "NA");
    const naBoarding = boardingTypes.find((ele) => ele.name === "NA");
    const naSubward = subwards.find((ele) => ele.name === "NA");
    const naStream = streams.find((ele) => ele.name === "NA");

    const studentsRaw = [];
    let i = 1;

    for (const row of file3Data) {
      const fname = row["Student F Name"];
      const mname = row["Student Middle Name"]?.includes("-")
        ? ""
        : row["Student Middle Name"] + " ";
      const lname = row["Student Last Name"];
      const name = `${fname} ${mname}${lname}`;

      let class_ = classes.find(
        (ele) => ele.name === row["Class"]?.toUpperCase()
      );

      if (!class_) class_ = naClass;

      let section = sections.find(
        (ele) => ele.name === row["Section"]?.toUpperCase()
      );

      if (!section) section = naSection;

      let gender = "na";
      if (row["Gender"] === "MALE") gender = "m";
      else if (row["Gender"] === "FEMALE") gender = "f";

      console.log("Admission No. :>> ", row["Admission No."]);

      const doaRaw = row["Date of Admission"] || 0;
      console.log("doaRaw :>> ", doaRaw);
      const doa =
        typeof doaRaw === "number"
          ? new Date(UC.excelDateToJSDate(doaRaw))
          : isNaN(new Date(doaRaw))
          ? new Date(
              new Date(convertDateString(doaRaw))
                .toISOString()
                .replace("Z", "-05:30")
            )
          : new Date(new Date(doaRaw).toISOString().replace("Z", "-05:30"));

      let student_status = "o";
      if (doa.getUTCFullYear() === 2024) student_status = "n";

      const dobRaw = row["Date of Birth"] || 0;
      console.log("dobRaw :>> ", dobRaw);
      const dob =
        typeof dobRaw === "number"
          ? new Date(UC.excelDateToJSDate(dobRaw))
          : isNaN(new Date(dobRaw))
          ? new Date(
              new Date(convertDateString(dobRaw))
                .toISOString()
                .replace("Z", "-05:30")
            )
          : new Date(new Date(dobRaw).toISOString().replace("Z", "-05:30"));

      const age = isNaN(dob)
        ? 0
        : new Date().getUTCFullYear() - dob.getUTCFullYear();

      const email = row["Email Id"];
      if (!isEmailValid(email)) {
        throw new Error(`Invalid email '${email}' at row: ${i}`);
      }

      const student = {
        admission_no: row["Admission No."],
        admission_serial: row["Registration No."],
        student_id: "",
        roll_no: row["Roll No."],
        name,
        class: class_._id,
        section: section._id,
        stream: naStream._id,
        gender,
        blood_group: row["Blood Group"],
        doa: isNaN(doa) ? new Date(0) : doa,
        student_status,
        phone: row["Mobile"] || "1111111111",
        father_details: {
          name: row["Father Salutation"] + row["Father Name"],
          phone: row["Father Ph No."],
          designation: row["Father Profession"],
          office_address:
            row["Father Office Name"] + row["Father Office Address"],
          job_title: row["Father Department"],
          adhaar: row["Father Adhaar Card No"],
        },
        mother_details: {
          name: row["Mother Salutation"] + row["Mother Name"],
          phone: row["Mother Phone No."],
          job_title: row["Mother Designation"],
          adhaar: row["Mother Adhaar Card No"],
        },
        dob: isNaN(dob) ? new Date(0) : dob,
        age,
        address: {
          permanent: `${row["Address"]?.replaceAll(row["City"])} ${
            row["City"]
          } - ${row["Pincode"]}`,
          correspondence: `${row["Address"]?.replaceAll(row["City"])} ${
            row["City"]
          } - ${row["Pincode"]}`,
        },
        religion: row["Religion"],
        cast: row["Category"],
        boarding_type: naBoarding._id,
        sub_ward: naSubward._id,
        student_adhaar: row["Student Adhaar No"],
        email,
        photo: row["Admission No."].replaceAll("/", "_"),
        rfid: crypto.randomBytes(10).toString("hex"),
        academic_year: req.ayear,
        school: req.school._id,
      };

      studentsRaw.push(student);

      i++;
    }

    // return res.json(studentsRaw);

    for (const stuData of studentsRaw) {
      if (await Student.any({ admission_no: stuData.admission_no })) {
        await Student.updateOne(
          { admission_no: stuData.admission_no },
          { $set: stuData }
        );
      } else await Student.create(stuData);
    }

    res.json({
      total: studentsRaw.length,
      students: studentsRaw,
    });
  })
);

router.post(
  "/3",
  authenticate,
  upload(uploadPaths.bulk_import).single("file"),
  asyncHandler(async (req, res) => {
    const data = UC.excelToJson(req.file.path);
    fs.unlinkSync(req.file.path);

    const TERM1 = "APR 2024";
    const TERM2 = "MAY 2024";
    const TERM3 = "JUN 2024";
    const TERM4 = "JUL 2024";
    const TERM5 = "AUG 2024";
    const TERM6 = "SEP 2024";
    const TERM7 = "OCT 2024";
    const TERM8 = "NOV 2024";
    const TERM9 = "DEC 2024";
    const TERM10 = "JAN 2025";
    const TERM11 = "FEB 2025";
    const TERM12 = "MAR 2025";

    const results = [];
    const errors = [];

    // const admNos = {};

    // for (const row of data) {
    //   const admNo = row["ADMISSION_NO"];

    //   if (!admNos[admNo]) admNos[admNo] = 1;
    //   else admNos[admNo] += 1;
    // }

    // for (const adm of Object.keys(admNos)) {
    //   if (admNos[adm] > 1) errors.push(`${adm}`);
    // }

    // return res.json({ total_errors: errors.length, errors, admNos });

    for (const row of data) {
      let TOTAL = parseFloat(row["Total"]);

      const feesToPay = {
        one_time_fees: ["ONE_TIME_FEES"],
        term_fees: [],
        partial_fees: [],
      };
      const admNo = row["ADMISSION_NO"];

      const student = await Student.findOne({ admission_no: admNo })
        // .select("student_status")
        .lean();
      if (student?.student_status === "o") {
        TOTAL -= 60000;
      }

      const annualCharge = parseFloat(row["ANNUAL_CHARGE"]);
      const annualChargePaid = parseFloat(row["ANNUAL_CHARGE_PAID"]);

      if (annualChargePaid >= annualCharge * 1) {
        feesToPay.partial_fees.push(TERM1, TERM2, TERM3);
      }

      if (annualChargePaid >= annualCharge * 2) {
        feesToPay.partial_fees.push(TERM4, TERM5, TERM6);
      }

      if (annualChargePaid >= annualCharge * 3) {
        feesToPay.partial_fees.push(TERM7, TERM8, TERM9);
      }

      if (annualChargePaid >= annualCharge * 4) {
        feesToPay.partial_fees.push(TERM10, TERM11, TERM12);
      }

      const TUITION = row["TUITION_FEE"];
      const BUS = row["BUS_FEE"];

      const TAPR = row["TUITION_APR"];
      const TMAY = row["TUITION_MAY"];
      const TJUN = row["TUITION_JUN"];
      const BAPR = row["BUS_APR"];
      const BMAY = row["BUS_MAY"];
      const BJUN = row["BUS_JUN"];
      const TJUL = row["TUITION_JUL"];
      const TAUG = row["TUITION_AUG"];
      const TSEP = row["TUITION_SEP"];
      const BJUL = row["BUS_JUL"];
      const BAUG = row["BUS_AUG"];
      const BSEP = row["BUS_SEP"];
      const TOCT = row["TUITION_OCT"];
      const TNOV = row["TUITION_NOV"];
      const TDEC = row["TUITION_DEC"];
      const BOCT = row["BUS_OCT"];
      const BNOV = row["BUS_NOV"];
      const BDEC = row["BUS_DEC"];
      const TJAN = row["TUITION_JAN"];
      const TFEB = row["TUITION_FEB"];
      const TMAR = row["TUITION_MAR"];
      const BJAN = row["BUS_JAN"];
      const BFEB = row["BUS_FEB"];
      const BMAR = row["BUS_MAR"];

      if (TUITION && BUS) {
        if (TAPR && BAPR) feesToPay.term_fees.push(TERM1);
        if (TMAY && BMAY) feesToPay.term_fees.push(TERM2);
        if (TJUN && BJUN) feesToPay.term_fees.push(TERM3);
        if (TJUL && BJUL) feesToPay.term_fees.push(TERM4);
        if (TAUG && BAUG) feesToPay.term_fees.push(TERM5);
        if (TSEP && BSEP) feesToPay.term_fees.push(TERM6);
        if (TOCT && BOCT) feesToPay.term_fees.push(TERM7);
        if (TNOV && BNOV) feesToPay.term_fees.push(TERM8);
        if (TDEC && BDEC) feesToPay.term_fees.push(TERM9);
        if (TJAN && BJAN) feesToPay.term_fees.push(TERM10);
        if (TFEB && BFEB) feesToPay.term_fees.push(TERM11);
        if (TMAR && BMAR) feesToPay.term_fees.push(TERM12);
      } else if (TUITION) {
        if (TAPR) feesToPay.term_fees.push(TERM1);
        if (TMAY) feesToPay.term_fees.push(TERM2);
        if (TJUN) feesToPay.term_fees.push(TERM3);
        if (TJUL) feesToPay.term_fees.push(TERM4);
        if (TAUG) feesToPay.term_fees.push(TERM5);
        if (TSEP) feesToPay.term_fees.push(TERM6);
        if (TOCT) feesToPay.term_fees.push(TERM7);
        if (TNOV) feesToPay.term_fees.push(TERM8);
        if (TDEC) feesToPay.term_fees.push(TERM9);
        if (TJAN) feesToPay.term_fees.push(TERM10);
        if (TFEB) feesToPay.term_fees.push(TERM11);
        if (TMAR) feesToPay.term_fees.push(TERM12);
      }

      // console.log("admNo :>> ", admNo);
      // console.log("feesToPay :>> ", feesToPay);

      let fees;

      try {
        fees = await FEE.getStudentFees(
          admNo,
          req.ayear,
          feesToPay.term_fees,
          feesToPay.partial_fees,
          feesToPay.one_time_fees
        );
      } catch (err) {
        errors.push(`Error: ${err.message} | ${admNo}`);
        continue;
      }

      TOTAL = fees.total_due_amount;

      if (TOTAL !== fees.total_due_amount) {
        const terms = [
          ...feesToPay.one_time_fees,
          ...feesToPay.term_fees,
          ...feesToPay.partial_fees,
        ].toString();

        errors.push(
          `Amount should be: ${fees.total_due_amount}, instead got: ${TOTAL} | ${admNo}`
        );
      } else {
        results.push(`amount is correct: ${TOTAL} | ${admNo}`);
      }

      const getPaidFor = (fees) => {
        const paidFor = [];

        if (fees.one_time_fees.length) paidFor.push(C.ONE_TIME_FEES);

        for (let i = 0; i < fees.term_fees.length; i++) {
          const tf = fees.term_fees[i];
          const pf = fees.partial_fees[i];

          paidFor.push(`${C.TERM_FEES} ${tf.fee_term.name}`);

          if (!pf) continue;

          paidFor.push(`${C.PARTIAL_FEES} ${pf.fee_term.name}`);
        }

        return paidFor;
      };

      const paidFor = getPaidFor(fees);

      const manualFeePayment = await ManualFeePayment.create({
        student: fees.student._id,
        payment_modes: { cash: TOTAL },
        paid_for: paidFor,
        total_amount: fees.total_amount,
        academic_year: req.ayear,
        collected_by: req.user._id,
      });

      if (
        await FeePaid.any({
          student: fees.student._id,
          academic_year: req.ayear,
        })
      ) {
        await FeePaid.updateOne(
          { student: fees.student._id, academic_year: req.ayear },
          {
            $push: {
              manual_fee_payments: manualFeePayment._id,
              one_time_fees: fees.one_time_fees,
              term_fees: fees.term_fees,
              partial_fees: fees.partial_fees,
            },
            $inc: {
              total_amount: fees.total_amount,
              total_concession: fees.total_concession,
              total_fine: fees.total_fine,
              total_due_amount: fees.total_due_amount,
            },
          }
        );
      } else {
        const feePaid = await FeePaid.create({
          student: fees.student._id,
          manual_fee_payments: [manualFeePayment._id],
          one_time_fees: fees.one_time_fees,
          term_fees: fees.term_fees,
          partial_fees: fees.partial_fees,
          total_amount: fees.total_amount,
          total_concession: fees.total_concession,
          total_fine: fees.total_fine,
          total_due_amount: fees.total_due_amount,
          academic_year: req.ayear,
        });
      }

      // Ledger
      const note = `STUDENT MANUAL FEE PAYMENT THROUGH CASH`;

      const ledger = await LEDGER.credit(C.CASH, TOTAL, note, C.FEE_COLLECTION);

      // results.push(ledger);
    }

    // res.json({ total: data.length, data });
    res.json({
      total_students: await Student.countDocuments(),
      total_results: results.length,
      results,
      total_errors: errors.length,
      errors: errors.sort(),
    });
  })
);

router.post(
  "/4",
  asyncHandler(async (req, res) => {
    const toFind = [
      "GDGPS00010/2023-24",
      "GDGPS0070/2023/24",
      "GDGPS0101/2023-24",
      "GDGPS0102/2023-24",
      "GDGPS0103/2023-24",
      "GDGPS0105/2023-24",
      "GDGPS0106/2023-24",
      "GDGPS0108/2023-24",
      "GDGPS0415/2024-25",
      "GDGPS0431/2023-24",
      "GDGPS0432/2023-24",
      "GDGPS0563/2024-25",
      "GDGPS530/2024-25",
      "GDGPS582/2024-25",
      "GDGS0605/2024-25",
      "GDPS0461/2024-25",
      "GDPS0590/2024-25",
    ];

    const file = path.join(
      "data",
      "imports",
      "consolidated student data_3.xlsx"
    );
    const data = UC.excelToJson(file);

    console.log("toFind.length :>> ", toFind.length);

    const result = [];
    for (const admNo of toFind) {
      const stu = toFind.find((ele) => ele["Admission No."] === admNo);
      if (stu) {
        result.push({
          admNo,
          found: true,
        });
      } else {
        result.push({
          admNo,
          found: false,
        });
      }
    }

    console.log("result.length :>> ", result.length);

    res.json(result);
  })
);

module.exports = router;
