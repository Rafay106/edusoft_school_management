const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("puppeteer");
const { PDFDocument } = require("pdf-lib");
const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const Student = require("../models/studentInfo/studentModel");
const IdCardGenerated = require("../models/admin_section/idCardGeneratedModel");
const Class = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const { DOMAIN } = process.env;

// @desc    Generate student id-cards
// @route   POST /api/admin-section/id-card/student
// @access  Private
const genStudentIdCard = asyncHandler(async (req, res) => {
  const admNo = req.body.adm_no;

  let students = [];

  if (admNo) {
    students = await Student.find({ admission_no: admNo })
      .populate("class section bus_pick bus_stop academic_year", "name title")
      .lean();
  } else {
    const classId = await UC.validateClassByName(
      req.body.class_name,
      req.ayear
    );
    const sectionId = await UC.validateSectionByName(
      req.body.section,
      req.ayear
    );

    students = await Student.find({ class: classId, section: sectionId })
      .populate(
        "class section stream bus_pick bus_stop academic_year",
        "name title"
      )
      .sort("roll_no")
      .lean();
  }

  if (students.length === 0) {
    res.status(404);
    throw new Error(`Student(s) not found!`);
  }

  const className = students[0].class.name;
  const sectionName = students[0].section.name;

  const classAndSection = `${className}-${sectionName}`;
  const now = new Date();
  const YMD = UC.getYMD();

  const pdfName = `id_cards_${classAndSection}_${YMD}_${now.getTime()}.pdf`;
  const pdfPath = path.join(UC.getAppRootDir(__dirname), "data", "id_cards");

  if (!fs.existsSync(pdfPath)) fs.mkdirSync(pdfPath, { recursive: true });

  const pdfFile = path.join(pdfPath, pdfName);

  const idCards = [];

  for (const student of students) {
    const isBusStudent = student.bus_pick || student.bus_pick ? true : false;

    const template = path.join(
      UC.getAppRootDir(__dirname),
      "templates",
      "id_card",
      // "id_card_old.html"
      isBusStudent ? "id_card_bus.html" : "id_card.html"
    );

    const idCard = await generateStudentIdCard(student, template);

    idCards.push(`./data/id_cards/${idCard}`);
  }

  await combinePDFs(idCards, pdfFile);

  await IdCardGenerated.create({ file: pdfName, school: req.school._id });

  res.status(200).json({ msg: `${DOMAIN}/id_cards/${pdfName}` });
  // res.download(pdfFile, pdfName, (err) => {
  //   if (err) throw err;
  // });
});

// @desc    Generate student id-cards all
// @route   POST /api/admin-section/id-card/student/all
// @access  Private
const genStudentIdCardAll = asyncHandler(async (req, res) => {
  const students = await Student.find()
    .populate("class section bus_pick bus_stop academic_year", "name title")
    .lean();

  if (students.length === 0) {
    res.status(404);
    throw new Error(`Student(s) not found!`);
  }

  students.sort((a, b) => {
    const strA = `${a.class.name}${a.section.name}`;
    const strB = `${b.class.name}${b.section.name}`;
    return strA.localCompare(strB);
  });

  const classAndSection = `${students[0].class.name}-${students[0].section.name}`;
  const now = new Date();
  const YMD = UC.getYMD();

  const pdfName = `id_cards_${classAndSection}_${YMD}_${now.getTime()}.pdf`;
  const pdfPath = path.join(UC.getAppRootDir(__dirname), "data", "id_cards");

  if (!fs.existsSync(pdfPath)) fs.mkdirSync(pdfPath, { recursive: true });

  const pdfFile = path.join(pdfPath, pdfName);

  const idCards = [];

  for (const student of students) {
    const isBusStudent = student.bus_pick || student.bus_pick ? true : false;

    const template = path.join(
      UC.getAppRootDir(__dirname),
      "templates",
      "id_card",
      // "id_card_old.html"
      isBusStudent ? "id_card_bus.html" : "id_card.html"
    );

    const idCard = await generateStudentIdCard(student, template);

    idCards.push(`./data/id_cards/${idCard}`);
  }

  await combinePDFs(idCards, pdfFile);

  await IdCardGenerated.create({ file: pdfName, school: req.school._id });

  res.status(200).json({ msg: `${DOMAIN}/id_cards/${pdfName}`, students });
  // res.download(pdfFile, pdfName, (err) => {
  //   if (err) throw err;
  // });
});

const generateStudentIdCard = async (student, template) => {
  const background = fs.readFileSync(
    path.join("templates", "id_card", "images", "background.jpg"),
    "base64"
  );

  const logo = fs.readFileSync(
    path.join("templates", "id_card", "images", "acharyakulam.png"),
    "base64"
  );

  const bloodLogo = fs.readFileSync(
    path.join("templates", "id_card", "images", "blood.png"),
    "base64"
  );

  const pedestrian = fs.readFileSync(
    path.join("templates", "id_card", "images", "pedestrian.png"),
    "base64"
  );

  // const barcode = fs.readFileSync(
  //   path.join("templates", "id_card", "images", "barcode.png"),
  //   "base64"
  // );

  // const barcode = await genBarcode(student.admission_no);

  // const signature = fs.readFileSync(
  //   path.join("templates", "id_card", "images", "signature.png"),
  //   "base64"
  // );

  let photo;
  if (student.photo) {
    const photoPath = path.join("static", "uploads", "student", student.photo);
    if (fs.existsSync(photoPath)) {
      photo = await processImage(photoPath);
    } else {
      photo = fs.readFileSync(
        path.join("templates", "id_card", "images", "user-blank.png"),
        "base64"
      );
    }
  } else {
    photo = fs.readFileSync(
      path.join("templates", "id_card", "images", "user-blank.png"),
      "base64"
    );
  }

  const bloodGroup =
    student.blood_group == "NA" || !student.blood_group
      ? ""
      : student.blood_group;

  const house = student.house.split(" ")[0];
  const session = student.academic_year.title;

  const htmlContent = fs
    .readFileSync(template, "utf8")
    .replace("{{background}}", `data:image/jpeg;base64,${background}`)
    .replace("{{logo}}", `data:image/jpeg;base64,${logo}`)
    .replace("{{session}}", session)
    .replace("{{photo}}", `data:image/jpg;base64,${photo}`)
    .replace("{{admno}}", student.admission_no)
    .replace("{{class}}", `${student.class.name}-${student.section.name}`)
    .replace("{{dob}}", UC.getDDMMYYYY(student.dob) || "")
    .replace("{{house}}", house || "")
    .replace("{{name}}", student.name)
    .replace("{{father}}", student.father_details?.name || "")
    .replace("{{mother}}", student.mother_details?.name || "")
    .replace("{{roll_no}}", student.roll_no || "")
    .replace("{{blood-logo}}", `data:image/jpeg;base64,${bloodLogo}`)
    .replace("{{blood}}", bloodGroup)
    .replace("{{address}}", student.address.correspondence || "")
    .replace("{{bus-stop}}", student.bus_stop?.name || "")
    .replace("{{phone}}", student.phone || "")
    .replace("{{bus-name}}", student.bus_pick?.name || "")
    .replace("{{pedestrian}}", `data:image/jpeg;base64,${pedestrian}`);

  const args = {
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--disable-gpu",
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--no-zygote",
    ],
  };

  const browser =
    process.platform === "linux"
      ? await puppeteer.launch(args)
      : await puppeteer.launch();

  const page = await browser.newPage();

  await page.setViewport({ height: 1024, width: 640 });

  await page.setContent(htmlContent);

  // Wait for images to load
  // await page.waitForSelector("#logo-img");

  const tempName = `id_card_${student.admission_no.replace("/", "")}.pdf`;

  const pdfOptions = {
    path: path.join("data", "id_cards", tempName),
    width: "54mm",
    height: "85mm",
    printBackground: true,
    margin: {
      top: "0mm",
      right: "0mm",
      bottom: "0mm",
      left: "0mm",
    },
  };

  await page.pdf(pdfOptions);

  await browser.close();

  return tempName;
};

const compressImage = async (inputBuffer) => {
  return await sharp(inputBuffer)
    .rotate()
    .resize({ width: 800 }) // Resize to a max width of 800px, maintaining aspect ratio
    .jpeg({ quality: 80 }) // Compress the image to 80% quality
    .toBuffer();
};

const processImage = async (inputFilePath) => {
  try {
    // Step 1: Read the file and convert it to a buffer
    const inputBuffer = await fs.promises.readFile(inputFilePath);

    // Step 2: Compress the image
    const compressedBuffer = await compressImage(inputBuffer);

    // Step 3: Convert the compressed buffer to a Base64 string
    const base64String = compressedBuffer.toString("base64");

    // Step 4: Return the Base64 string
    return base64String;
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

const combinePDFs = async (pdfFiles, outputFile) => {
  const mergedPdf = await PDFDocument.create();

  for (const pdfFile of pdfFiles) {
    const pdfBytes = await fs.promises.readFile(pdfFile);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(
      pdfDoc,
      pdfDoc.getPageIndices()
    );
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
    });
  }

  const mergedPdfBytes = await mergedPdf.save();

  await fs.promises.writeFile(outputFile, mergedPdfBytes);

  for (const pdfFile of pdfFiles) {
    fs.unlinkSync(pdfFile);
  }
};

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

const genBarcode = async (
  data,
  lineColor = "black",
  width = 3,
  height = "40px",
  displayValue = false
) => {
  const { Canvas } = require("canvas");
  const jsBarcode = require("jsbarcode");

  const canvas = new Canvas();

  jsBarcode(canvas, data, {
    lineColor,
    width,
    height,
    displayValue,
  });

  const imgBase64 = await new Promise((resolve, reject) => {
    canvas.toDataURL("image/png", (err, imgBase64) => {
      if (err) {
        reject(reject);
        return;
      }

      resolve(imgBase64);
    });
  });

  return imgBase64;
};

// @desc    Get all generated id-cards
// @route   GET /api/admin-section/id-card-generated
// @access  Private
const getGeneratedIdCards = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["year", "title"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    IdCardGenerated,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  for (const card of results.result) {
    card.file = `${DOMAIN}/id_cards/${card.file}`;
  }

  res.status(200).json(results);
});

// @desc    Delete a generated id-card
// @route   DELETE /api/admin-section/id-card-generated
// @access  Private
const deleteGeneratedIdCard = asyncHandler(async (req, res) => {
  const ids = req.body.ids;

  if (!ids || ids.length === 0) {
    res.status(400);
    throw new Error(C.getFieldIsReq("ids"));
  }

  for (const id of ids) {
    const card = await IdCardGenerated.findById(id).select("file").lean();

    if (card) fs.unlinkSync(path.join("data", "id_cards", card.file));
  }

  const result = await IdCardGenerated.deleteMany({ _id: ids });

  res.status(200).json(result);
});

// @desc    Delete all generated id-cards
// @route   DELETE /api/admin-section/id-card-generated/all
// @access  Private
const deleteAllGeneratedIdCard = asyncHandler(async (req, res) => {
  const cards = await IdCardGenerated.find({}).select("file").lean();

  for (const card of cards) {
    const filePath = path.join("data", "id_cards", card.file);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  const result = await IdCardGenerated.deleteMany({
    _id: cards.map((c) => c._id),
  });

  res.status(200).json(result);
});

module.exports = {
  genStudentIdCard,
  genStudentIdCardAll,

  getGeneratedIdCards,
  deleteGeneratedIdCard,
  deleteAllGeneratedIdCard,
};
