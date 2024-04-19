const fs = require("fs");
const path = require("path");
const UC = require("./utils/common");
const PDFDocument = require("pdfkit");
const puppeteer = require("puppeteer");

const now = new Date();
const year = now.getUTCFullYear();
const month = now.getUTCMonth() + 1;
const date = now.getUTCDate();
const pdfName = `id_cards_${year}_${month}_${date}_${now.getTime()}.pdf`;
const pdfPath = path.join(
  UC.getAppRootDir(__dirname),
  "data",
  "id_cards",
  "class"
);

if (!fs.existsSync(pdfPath)) fs.mkdirSync(pdfPath, { recursive: true });

const pdfFile = path.join(pdfPath, pdfName);

const template = path.join(
  UC.getAppRootDir(__dirname),
  "templates",
  "id_card",
  "id_card.html"
);

const logo = fs.readFileSync(
  path.join("templates", "id_card", "images", "logo.png"),
  "base64"
);

const photo = fs.readFileSync(
  path.join("templates", "id_card", "images", "user-blank.png"),
  "base64"
);

const busLogo = fs.readFileSync(
  path.join("templates", "id_card", "images", "bus-school.png"),
  "base64"
);

const signature = fs.readFileSync(
  path.join("templates", "id_card", "images", "signature.png"),
  "base64"
);

const htmlContent = fs
  .readFileSync(template, "utf8")
  .replace("{{logo}}", `data:image/jpeg;base64,${logo}`)
  .replace("{{photo}}", `data:image/jpeg;base64,${photo}`)
  .replace("{{bus-logo}}", `data:image/jpeg;base64,${busLogo}`)
  .replace("{{signature}}", `data:image/jpeg;base64,${signature}`);

// Data for the ID card
const data = {
  logo: "./templates/id_card/images/logo.png",
  name: "John Doe",
  phone: "1234567890",
  class: "10",
  admno: "12345",
  address: "123 Main St, City",
  signature: "./templates/id_card/images/signature.png",
};

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set the viewport to match the desired PDF size (85mm x 54mm)
  await page.setViewport({ height: 1024, width: 640 });

  await page.setContent(htmlContent);

  // Wait for images to load
  await page.waitForSelector("#logo-img");

  // Set the PDF options
  const pdfOptions = {
    path: pdfFile,
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

  // Generate PDF
  await page.pdf(pdfOptions);

  await browser.close();

  console.log("PDF generated successfully!");
})();
