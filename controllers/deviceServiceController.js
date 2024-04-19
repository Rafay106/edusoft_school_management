const asyncHandler = require("express-async-handler");
const Bus = require("../models/transport/busModel");

const postService = asyncHandler(async (req, res) => {
  const op = req.body.op;
  if (!op) {
    res.status(400);
    throw new Error("op is required!");
  }

  if (op === "get_cmd_exec") {
    // const dataList = await Bus.aggregate([
    //   { $project: { device: 1 } },
    //   {
    //     $lookup: {
    //       from: "device_cmd_execs",
    //       localField: "imei",
    //       foreignField: "imei",
    //       as: "commands",
    //     },
    //   },
    //   { $unwind: "$commands" },
    //   { $match: { "commands.status": false } },
    //   { $sort: { "commands.cmd_id": 1 } },
    // ]).exec();

    const dataList = [];

    const result = [];

    for (const data of dataList) {
      if (data.protocol !== "android" && data.protocol !== "iphone") {
        result.push({
          cmd_id: data.commands.cmd_id,
          protocol: data.protocol,
          net_protocol: data.net_protocol,
          ip: data.ip,
          port: parseInt(data.port),
          imei: data.imei,
          type: "ascii",
          cmd: data.commands.cmd,
        });
      }
    }

    res.status(200).send(result);
  } else if (op === "set_cmd_exec") {
    const { cmd_id, status, re_hex } = req.body;

    if (cmd_id === undefined) {
      res.status(400);
      throw new Error("cmd_id is required!");
    }

    if (status === undefined) {
      res.status(400);
      throw new Error("status is required!");
    }

    let resp;
    if (re_hex !== undefined) {
      const reply = Buffer.from(re_hex, "hex").toString();

      //   resp = await DeviceCmdExec.updateOne(
      //     { cmd_id },
      //     { $set: { status, re_hex, reply } }
      //   );
    } else {
      //   resp = await DeviceCmdExec.updateOne({ cmd_id }, { $set: { status } });
    }

    if (resp?.matchedCount === 1)
      res.status(200).json({ msg: "Command Updated!" });
    else res.status(404).json({ msg: "Command not found!" });
  } else {
    res.status(400);
    throw new Error("op command not found!");
  }
});

module.exports = { postService };
