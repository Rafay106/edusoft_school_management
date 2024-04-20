const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const UC = require("../utils/common");
const fs = require("node:fs");
const path = require("node:path");
const RazorpayPayment = require("../models/fees/razorPayModel");
const { bulkImportUpload } = require("../middlewares/multerMiddleware");
const BusStaff = require("../models/transport/busStaffModel");

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

    const today = new Date().setHours(0, 0, 0, 0);

    const busStaffs = [];
    for (const row of fileData) {
      const bs = {};

      if (
        row.name.toLowerCase().includes("khalasi") ||
        row.name.toLowerCase().includes("khalsi")
      ) {
        bs.type = "c";
      } else bs.type = "d";

      row.name = row.name.split(" ");
      bs.name = {
        f: row.name[0],
        l: row.name.slice(1).toString().replaceAll(",", " "),
      };

      bs.doj = today;
      bs.phone = row.mobile;
      bs.manager = "662116947ac87232e8ad80ea";
      bs.school = "662116b39c1ec4f9725ea9e1";

      busStaffs.push(bs);
    }

    const busStaff = await BusStaff.create(busStaffs);

    res.json(busStaff);
  })
);

module.exports = router;
