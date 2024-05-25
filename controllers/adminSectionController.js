const fs = require("node:fs");
const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const IdCard = require("../models/admin_section/idCardModel");
const Student = require("../models/studentInfo/studentModel");
const puppeteer = require("puppeteer");
const { PDFDocument } = require("pdf-lib");
const IdCardGenerated = require("../models/admin_section/idCardGeneratedModel");
const { DOMAIN } = process.env;

// @desc    Get all id-cards
// @route   GET /api/admin-section/id-card
// @access  Private
const getIdCards = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["year", "title"];

    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(IdCard, query, {}, page, limit, sort);

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a id-card
// @route   GET /api/admin-section/id-card/:id
// @access  Private
const getIdCard = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const idCard = await IdCard.findOne(query).populate("school", "name").lean();

  if (!idCard) {
    res.status(404);
    throw new Error(C.getResourse404Id("IdCard", req.params.id));
  }

  if (idCard.card.background) {
    idCard.card.background = `${DOMAIN}/uploads/admin_system/id_card/${idCard.card.background}`;
  }

  if (idCard.card.logo) {
    idCard.card.logo = `${DOMAIN}/uploads/admin_system/id_card/${idCard.card.logo}`;
  }

  if (idCard.card.signature) {
    idCard.card.signature = `${DOMAIN}/uploads/admin_system/id_card/${idCard.card.signature}`;
  }

  if (idCard.photo.file) {
    idCard.photo.file = `${DOMAIN}/uploads/admin_system/id_card/${idCard.photo.file}`;
  }

  res.status(200).json(idCard);
});

// @desc    Add a id-card
// @route   POST /api/admin-section/id-card
// @access  Private
const createIdCard = asyncHandler(async (req, res) => {
  const school = await UC.validateSchool(req.user, req.body.school);
  const ayear = UC.getCurrentAcademicYear(req.body.school);

  const files = req.files;
  const orientation = req.body.orientation;

  const card = {
    height_mm: orientation === "v" ? 85 : 54,
    width_mm: orientation === "v" ? 54 : 85,
    background: files.background ? files.background[0].filename : "",
    logo: files.logo ? files.logo[0].filename : "",
    signature: files.signature ? files.signature[0].filename : "",
  };

  if (req.body.card_height_mm) card.height_mm = req.body.card_height_mm;
  if (req.body.card_width_mm) card.width_mm = req.body.card_width_mm;

  const photo = {
    file: files.photo ? files.photo[0].filename : "",
    style: req.body.photo_style,
    height_mm: orientation === "v" ? 21 : 13,
    width_mm: orientation === "v" ? 21 : 13,
  };

  if (req.body.photo_height_mm) photo.height_mm = req.body.photo_height_mm;
  if (req.body.photo_width_mm) photo.width_mm = req.body.photo_width_mm;

  const layout_padding_mm = {
    top: req.body.pad_top,
    bottom: req.body.pad_bottom,
    left: req.body.pad_left,
    right: req.body.pad_right,
  };

  const idCard = await IdCard.create({
    title: req.body.title,
    orientation,
    user_type: req.body.user_type,
    card,
    photo,
    layout_padding_mm,
    admission_no: req.body.admission_no,
    name: req.body.name,
    class: req.body.class,
    father_name: req.body.father_name,
    mother_name: req.body.mother_name,
    address: req.body.address,
    phone: req.body.phone,
    dob: req.body.dob,
    blood: req.body.blood,
    house: req.body.house,
    bus_stop: req.body.bus_stop,
    academic_year: ayear,
    school,
  });

  res.status(201).json({ msg: idCard._id });
});

// @desc    Update a id-card
// @route   PUT /api/admin-section/id-card/:id
// @access  Private
const updateIdCard = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await IdCard.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("IdCard", req.params.id));
  }

  if (year) {
    if (year.length > 4) {
      res.status(400);
      throw new Error("The year must be 4 digits.");
    }

    if (isNaN(parseInt(year))) {
      res.status(400);
      throw new Error("The year must be a number.");
    }
  }

  const files = req.files;

  const card = {
    height_mm: req.body.card_height_mm,
    width_mm: req.body.card_width_mm,
    background: files.background ? files.background[0].filename : undefined,
    logo: files.logo ? files.logo[0].filename : undefined,
    signature: files.signature ? files.signature[0].filename : undefined,
  };

  const photo = {
    file: files.photo ? files.photo[0].filename : undefined,
    style: req.body.photo_style,
    height_mm: req.body.photo_height_mm,
    width_mm: req.body.photo_height_mm,
  };

  const padding = {
    top: req.body.pad_top,
    bottom: req.body.pad_bottom,
    left: req.body.pad_left,
    right: req.body.pad_right,
  };

  const result = await IdCard.updateOne(query, {
    $set: {
      title: req.body.title,
      orientation: req.body.orientation,
      user_type: req.body.user_type,
      "card.height_mm": card.height_mm,
      "card.width_mm": card.width_mm,
      "card.background": card.background,
      "card.logo": card.logo,
      "card.signature": card.signature,
      "photo.file": photo.file,
      "photo.style": photo.style,
      "photo.height_mm": photo.height_mm,
      "photo.width_mm": photo.width_mm,
      "layout_padding_mm.top": padding.top,
      "layout_padding_mm.bottom": padding.bottom,
      "layout_padding_mm.left": padding.left,
      "layout_padding_mm.right": padding.right,
      admission_no: req.body.admission_no,
      name: req.body.name,
      class: req.body.class,
      father_name: req.body.father_name,
      mother_name: req.body.mother_name,
      address: req.body.address,
      phone: req.body.phone,
      dob: req.body.dob,
      blood: req.body.blood,
      house: req.body.house,
      bus_stop: req.body.bus_stop,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a id-card
// @route   DELETE /api/admin-section/id-card/:id
// @access  Private
const deleteIdCard = asyncHandler(async (req, res) => {
  const idCard = await IdCard.findById(req.params.id).select("_id").lean();

  if (!idCard) {
    res.status(400);
    throw new Error(C.getResourse404Id("IdCard", req.params.id));
  }

  const delQuery = { _id: req.params.id };

  const result = await IdCard.deleteOne(delQuery);

  res.status(200).json(result);
});

// @desc    Generate student id-cards
// @route   POST /api/admin-section/id-card/student
// @access  Private
const genStudentIdCard = asyncHandler(async (req, res) => {
  const admNo = req.body.adm_no;
  const class_ = req.body.class;
  const section = req.body.section;

  let students = [];

  if (admNo) {
    students = await Student.find({ admission_no: admNo })
      .populate("class section bus_stop", "name")
      .lean();
  } else {
    if (!class_) {
      res.status(400);
      throw new Error(C.getFieldIsReq("class"));
    }

    if (!section) {
      res.status(400);
      throw new Error(C.getFieldIsReq("section"));
    }

    students = await Student.find({ class: class_, section })
      .populate("class section bus_stop", "name")
      .sort("roll_no")
      .lean();
  }

  if (students.length === 0) {
    res.status(404);
    throw new Error(`Student(s) not found!`);
  }

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

  res.status(200).json({ msg: `${DOMAIN}/id_cards/${pdfName}` });
  // res.download(pdfFile, pdfName, (err) => {
  //   if (err) throw err;
  // });
});

const generateStudentIdCard = async (student, template) => {
  const background = fs.readFileSync(
    path.join("templates", "id_card", "images", "background-orange.jpeg"),
    "base64"
  );

  const logo = fs.readFileSync(
    path.join("templates", "id_card", "images", "acharya-logo.png"),
    "base64"
  );

  const busLogo = fs.readFileSync(
    path.join("templates", "id_card", "images", "bus-logo.png"),
    "base64"
  );

  const bloodLogo = fs.readFileSync(
    path.join("templates", "id_card", "images", "blood-logo.png"),
    "base64"
  );

  // const barcode = fs.readFileSync(
  //   path.join("templates", "id_card", "images", "barcode.png"),
  //   "base64"
  // );

  const barcode = await genBarcode(student.admission_no);

  const signature = fs.readFileSync(
    path.join("templates", "id_card", "images", "signature.png"),
    "base64"
  );

  let photo;
  if (student.photo) {
    const photoPath = path.join("static", "uploads", "student", student.photo);
    if (fs.existsSync(photoPath)) {
      photo = fs.readFileSync(photoPath, "base64");
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

  const htmlContent = fs
    .readFileSync(template, "utf8")
    .replace("{{background}}", `data:image/jpeg;base64,${background}`)
    .replace("{{logo}}", `data:image/jpeg;base64,${logo}`)
    .replace("{{photo}}", `data:image/jpeg;base64,${photo}`)
    .replace("{{admno}}", student.admission_no)
    .replace("{{class}}", `${student.class.name}-${student.section.name}`)
    .replace("{{dob}}", UC.getDDMMYYYY(student.dob) || "NA")
    .replace("{{house}}", student.house || "NA")
    .replace("{{name}}", student.name)
    .replace("{{father}}", student.father_details?.name || "NA")
    .replace("{{mother}}", student.mother_details?.name || "NA")
    .replace("{{bus-logo}}", `data:image/jpeg;base64,${busLogo}`)
    .replace("{{bus-name}}", student.bus?.name || "NA")
    .replace("{{address}}", student.address.permanent.slice(0, 20) || "NA")
    .replace("{{bus-stop}}", student.bus_stop?.name || "NA")
    .replace("{{phone}}", student.phone || "NA")
    .replace("{{blood-logo}}", `data:image/jpeg;base64,${bloodLogo}`)
    .replace("{{blood}}", student.blood_group || "NA")
    .replace("{{barcode}}", barcode)
    .replace("{{signature}}", `data:image/jpeg;base64,${signature}`);
  // .replace("{{pincode}}", student.address.current.pincode || "NA")

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
    query["$or"] = searchQuery["$or"];
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

module.exports = {
  getIdCards,
  getIdCard,
  createIdCard,
  updateIdCard,
  deleteIdCard,
  genStudentIdCard,

  getGeneratedIdCards,
  deleteGeneratedIdCard,
};
