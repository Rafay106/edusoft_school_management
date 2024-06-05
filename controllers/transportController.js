const fs = require("node:fs");
const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const BusStaff = require("../models/transport/busStaffModel");
const BusStop = require("../models/transport/busStopModel");
const Bus = require("../models/transport/busModel");
const User = require("../models/system/userModel");
const Student = require("../models/studentInfo/studentModel");

/** 1. BusStaff */

// @desc    Get all busStaffs
// @route   GET /api/transport/bus-staff
// @access  Private
const getBusStaffs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["name"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  console.log(query);

  const results = await UC.paginatedQuery(
    BusStaff,
    query,
    "",
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  for (const staff of results.result) {
    if (staff.type === "c") staff.type = C.CONDUCTOR;
    if (staff.type === "d") staff.type = C.DRIVER;

    if (!staff.photo) staff.photo = `${process.env.DOMAIN}/user-blank.svg`;
    else staff.photo = `${process.env.DOMAIN}/uploads/bus_staff/${staff.photo}`;
  }

  res.status(200).json(results);
});

// @desc    Get a busStaff
// @route   GET /api/transport/bus-staff/:id
// @access  Private
const getBusStaff = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const busStaff = await BusStaff.findOne(query).lean();

  if (!busStaff) {
    res.status(404);
    throw new Error(C.getResourse404Id("BusStaff", req.params.id));
  }

  res.status(200).json(busStaff);
});

// @desc    Add a busStaff
// @route   POST /api/transport/bus-staff
// @access  Private
const addBusStaff = asyncHandler(async (req, res) => {
  const photo = req.file ? req.file.filename : "";

  const busStaff = await BusStaff.create({
    type: req.body.type,
    name: req.body.name,
    doj: req.body.doj,
    email: req.body.email,
    phone: {
      primary: req.body.phone_primary,
      secondary: req.body.phone_secondary,
    },
    photo,
    driving_license: {
      number: req.body.dl_no,
      expiry_date: req.body.dl_exp,
    },
    school: req.school,
  });

  res.status(201).json({ msg: busStaff._id });
});

// @desc    Update a busStaff
// @route   PUT /api/transport/bus-staff/:id
// @access  Private
const updateBusStaff = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const busStaff = await BusStaff.findOne(query).select("_id photo").lean();

  if (!busStaff) {
    res.status(404);
    throw new Error(C.getResourse404Id("BusStaff", req.params.id));
  }

  const photo = req.file ? req.file.filename : undefined;

  if (req.body.dl_exp) {
    const dlExp = new Date(req.body.dl_exp);
    if (isNaN(dlExp)) {
      res.status(400);
      throw new Error(C.getFieldIsInvalid("dt_exp"));
    }
  }

  // Delete previous photo
  if (photo && busStaff.photo) {
    const photoPath = path.join(
      "static",
      "uploads",
      "bus_staff",
      busStaff.photo
    );

    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
  }

  const result = await BusStaff.updateOne(query, {
    $set: {
      type: req.body.type,
      name: req.body.name,
      doj: req.body.doj,
      email: req.body.email,
      "phone.primary": req.body.phone_primary,
      "phone.secondary": req.body.phone_secondary,
      photo,
      "driving_license.number": req.body.dl_no,
      "driving_license.expiry_date": req.body.dl_exp,
    },
  });

  res.status(200).json(result);
});

// TODO
// @desc    Delete a busStaff
// @route   DELETE /api/transport/bus-staff/:id
// @access  Private
const deleteBusStaff = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const staff = await BusStaff.findOne(query).select("_id photo").lean();

  if (!staff) {
    res.status(404);
    throw new Error(C.getResourse404Id("BusStaff", req.params.id));
  }

  if (
    await Bus.any({ $or: [{ driver: staff._id }, { conductor: staff._id }] })
  ) {
    res.status(400);
    throw new Error(C.getUnableToDel("BusStaff", "Bus"));
  }

  // Delete photo
  if (staff.photo) {
    const photoPath = path.join("static", "uploads", "bus_staff", staff.photo);

    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
  }

  const result = await BusStaff.deleteOne(query);

  res.status(200).json(result);
});

// @desc    Bulk operations for bus-staff
// @route   POST /api/transport/bus-staff/bulk
// @access  Private
const bulkOpsBusStaff = asyncHandler(async (req, res) => {
  const cmd = req.body.cmd;
  const busStaffs = req.body.bus_staffs;

  if (!cmd) {
    res.status(400);
    throw new Error("cmd is required!");
  }

  if (cmd === "import-xlsx") {
    if (!req.file) {
      res.status(400);
      throw new Error(C.getFieldIsReq("file"));
    }

    const fileData = UC.excelToJson(req.file.path);
    fs.unlinkSync(req.file.path);

    const result = await UC.addMultipleBusStaffs(fileData, req.school);

    return res.status(200).json({ total: result.length, msg: result });
  }

  if (cmd === "delete") {
    if (!busStaffs || busStaffs.length === 0) {
      res.status(400);
      throw new Error(C.getFieldIsReq("bus_staffs"));
    }

    if (await Bus.any({ driver: { $in: busStaffs } })) {
      res.status(400);
      throw new Error(C.getUnableToDel("BusStaff", "Bus"));
    }

    if (await Bus.any({ conductor: { $in: busStaffs } })) {
      res.status(400);
      throw new Error(C.getUnableToDel("BusStaff", "Bus"));
    }

    const result = await BusStaff.deleteMany({ _id: busStaffs });

    return res.status(200).json({ ...result });
  } else if (cmd === "export-json") {
    if (!busStaffs || busStaffs.length === 0) {
      res.status(400);
      throw new Error(C.getFieldIsReq("bus_staffs"));
    }

    const busesToExport = await BusStaff.find({ _id: busStaffs })
      .select("-createdAt -updatedAt")
      .sort("name")
      .lean();

    const fileName = `Bus_stops_${UC.getYMD()}.json`;
    const fileDir = path.join(getAppRootDir(__dirname), "temp", fileName);

    fs.writeFileSync(fileDir, JSON.stringify(busesToExport));

    return res.download(fileDir, fileName, () => {
      fs.unlinkSync(fileDir);
    });
  } else {
    res.status(400);
    throw new Error("cmd not found!");
  }
});

/** 2. BusStop */

// @desc    Get all bus stops
// @route   GET /api/transport/bus-stop
// @access  Private
const getBusStops = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["name", "address"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    BusStop,
    query,
    {},
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a bus-stop
// @route   GET /api/transport/bus-stop/:id
// @access  Private
const getBusStop = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const busStop = await BusStop.findOne(query).lean();

  if (!busStop) {
    res.status(404);
    throw new Error(C.getResourse404Id("BusStop", req.params.id));
  }

  res.status(200).json(busStop);
});

// @desc    Add a bus-stop
// @route   POST /api/transport/bus-stop
// @access  Private
const addBusStop = asyncHandler(async (req, res) => {
  const busStop = await BusStop.create({
    name: req.body.name,
    address: req.body.address,
    monthly_charges: req.body.monthly_charges,
    lat: parseFloat(req.body.lat).toFixed(6),
    lon: parseFloat(req.body.lon).toFixed(6),
    school: req.school,
  });

  res.status(201).json({ msg: busStop._id });
});

// @desc    Update a bus-stop
// @route   PATCH /api/transport/bus-stop/:id
// @access  Private
const updateBusStop = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (!(await BusStop.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Id("BusStop", req.params.id));
  }

  if (req.body.lat) req.body.lat = parseFloat(req.body.lat).toFixed(6);
  if (req.body.lon) req.body.lon = parseFloat(req.body.lon).toFixed(6);

  const result = await BusStop.updateOne(query, {
    $set: {
      name: req.body.name,
      address: req.body.address,
      monthly_charges: req.body.monthly_charges,
      lat: req.body.lat,
      lon: req.body.lon,
    },
  });

  res.status(200).json(result);
});

// @desc    Delete a bus-stop
// @route   DELETE /api/transport/bus-stop/:id
// @access  Private
const deleteBusStop = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const stop = await BusStop.findOne(query).select("_id").lean();

  if (!stop) {
    res.status(400);
    throw new Error(C.getResourse404Id("BusStop", req.params.id));
  }

  if (await Student.any({ bus_stop: stop._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("BusStop", "Student"));
  }

  if (await Bus.any({ stops: stop._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("BusStop", "Bus"));
  }

  const result = await BusStop.deleteOne(query);

  res.status(200).json(result);
});

// @desc    Bulk operations for bus-stops
// @route   POST /api/transport/bus-stop/bulk
// @access  Private
const bulkOpsBusStop = asyncHandler(async (req, res) => {
  const cmd = req.body.cmd;
  const busStops = req.body.bus_stops;

  if (!cmd) {
    res.status(400);
    throw new Error("cmd is required!");
  }

  if (cmd === "import-xlsx") {
    if (!req.file) {
      res.status(400);
      throw new Error(C.getFieldIsReq("file"));
    }

    const fileData = UC.excelToJson(req.file.path);
    fs.unlinkSync(req.file.path);

    const result = await UC.addMultipleBusStops(fileData, req.school);

    return res.status(200).json({ total: result.length, msg: result });
  }

  if (cmd === "delete") {
    if (!busStops || busStops.length === 0) {
      res.status(400);
      throw new Error(C.getFieldIsReq("bus_stops"));
    }

    if (await Bus.any({ stops: { $in: busStops } })) {
      res.status(400);
      throw new Error(C.getUnableToDel("BusStop", "Bus"));
    }

    const result = await BusStop.deleteMany({ _id: busStops });

    return res.status(200).json({ ...result });
  } else if (cmd === "export-json") {
    if (!busStops || busStops.length === 0) {
      res.status(400);
      throw new Error(C.getFieldIsReq("bus_stops"));
    }

    const busesToExport = await BusStop.find({ _id: busStops })
      .select("-createdAt -updatedAt")
      .sort("name")
      .lean();

    const fileName = `Bus_stops_${UC.getYMD()}.json`;
    const fileDir = path.join(getAppRootDir(__dirname), "temp", fileName);

    fs.writeFileSync(fileDir, JSON.stringify(busesToExport));

    return res.download(fileDir, fileName, () => {
      fs.unlinkSync(fileDir);
    });
  } else {
    res.status(400);
    throw new Error("cmd not found!");
  }
});

/** 3. Bus */

// @desc    Get all buses
// @route   GET /api/transport/bus
// @access  Private
const getBuses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const search = req.query.search;

  const query = {};

  if (search) {
    const fields = ["name"];
    const searchQuery = UC.createSearchQuery(fields, search);
    query["$or"] = searchQuery["$or"];
  }

  const results = await UC.paginatedQuery(
    Bus,
    query,
    "name device.imei driver conductor",
    page,
    limit,
    sort,
    ["driver conductor", "name"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a bus
// @route   GET /api/transport/bus/:id
// @access  Private
const getBus = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const bus = await Bus.findOne(query).lean();

  if (!bus) {
    res.status(404);
    throw new Error(C.getResourse404Id("Bus", req.params.id));
  }

  res.status(200).json(bus);
});

// @desc    Add a bus
// @route   POST /api/transport/bus
// @access  Private
const addBus = asyncHandler(async (req, res) => {
  const stops = await UC.validateBusStops(req.body.stops);

  if (!req.body.driver) {
    res.status(400);
    throw new Error(C.getFieldIsReq("driver"));
  }

  const driver = await BusStaff.findOne({ _id: req.body.driver, type: "d" })
    .select("_id")
    .lean();

  if (!driver) {
    res.status(400);
    throw new Error(C.getResourse404Id("driver", req.body.driver));
  }

  if (!req.body.conductor) {
    res.status(400);
    throw new Error(C.getFieldIsReq("conductor"));
  }

  const conductor = await BusStaff.findOne({
    _id: req.body.conductor,
    type: "c",
  })
    .select("_id")
    .lean();

  if (!conductor) {
    res.status(400);
    throw new Error(C.getResourse404Id("conductor", req.body.conductor));
  }

  const bus = await Bus.create({
    name: req.body.name,
    no_plate: req.body.no_plate,
    model: req.body.model,
    year_made: req.body.year_made,
    device: req.body.device,
    stops,
    driver,
    conductor,
    school: req.school,
  });

  res.status(201).json({ msg: bus._id });
});

// @desc    Update a bus
// @route   PUT /api/transport/bus/:id
// @access  Private
const updateBus = asyncHandler(async (req, res) => {
  const { driver, conductor } = req.body;
  let stops = req.body.stops;
  const stopOp = req.body.stop_op;

  const query = { _id: req.params.id };

  if (stops && stops.length > 0) {
    if (!stopOp) {
      res.status(400);
      throw new Error(C.getFieldIsReq("stop_op"));
    }

    if (stopOp === "a") {
      const bus = await Bus.findOne(query).select("stops").lean();

      stops = stops.filter((s) => {
        if (bus.stops.find((bs) => bs.toString() === s)) return false;
        else return true;
      });

      for (const stop of stops) {
        if (!(await BusStop.any({ ...query, _id: stop }))) {
          res.status(400);
          throw new Error(C.getResourse404Id("stops", stop));
        }
      }
    }
  }

  if (driver) {
    if (!(await BusStaff.any({ ...query, _id: driver, type: "d" }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("driver", driver));
    }
  }

  if (conductor) {
    if (!(await BusStaff.any({ ...query, _id: conductor, type: "c" }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("conductor", conductor));
    }
  }

  const bus = await Bus.findOne(query).select("_id").lean();

  if (!bus) {
    res.status(404);
    throw new Error(C.getResourse404Id("Bus", req.params.id));
  }

  const update = {
    $set: {
      name: req.body.name,
      no_plate: req.body.no_plate,
      model: req.body.model,
      year_made: req.body.year_made,
      "device.name": req.body.device?.name,
      driver,
      conductor,
    },
  };

  if (stopOp === "a") update["$push"] = { stops };
  if (stopOp === "r") update["$pullAll"] = { stops };

  const result = await Bus.updateOne(query, update);

  res.status(200).json(result);
});

// @desc    Delete a bus
// @route   DELETE /api/transport/bus/:id
// @access  Private
const deleteBus = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const bus = await Bus.findOne(query).select("_id").lean();

  if (!bus) {
    res.status(400);
    throw new Error(C.getResourse404Id("Bus", req.params.id));
  }

  if (await Student.any({ bus: bus._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("Bus", "Student"));
  }

  const result = await Bus.deleteOne(query);

  res.status(200).json(result);
});

// @desc    Bulk operations for bus
// @route   POST /api/transport/bus/bulk
// @access  Private
const bulkOpsBus = asyncHandler(async (req, res) => {
  const cmd = req.body.cmd;
  const buses = req.body.buses;

  if (!cmd) {
    res.status(400);
    throw new Error("cmd is required!");
  }

  if (cmd === "import-xlsx") {
    if (!req.file) {
      res.status(400);
      throw new Error(C.getFieldIsReq("file"));
    }

    const fileData = UC.excelToJson(req.file.path);
    fs.unlinkSync(req.file.path);

    const result = await UC.addMultipleBuses(fileData, req.school);

    return res.status(200).json({ total: result.length, msg: result });
  }

  if (cmd === "delete") {
    if (!buses || buses.length === 0) {
      res.status(400);
      throw new Error(C.getFieldIsReq("buses"));
    }

    const result = await Bus.deleteMany({
      _id: buses,
      createdBy: req.user._id,
    });

    return res.status(200).json({ ...result });
  } else if (cmd === "export-json") {
    if (!buses || buses.length === 0) {
      res.status(400);
      throw new Error(C.getFieldIsReq("buses"));
    }

    const busesToExport = await Bus.find({
      _id: buses,
      createdBy: req.user._id,
    })
      .select("-createdAt -updatedAt")
      .sort("name")
      .lean();

    const fileName = `Bus_${UC.getYMD()}.json`;
    const fileDir = path.join(getAppRootDir(__dirname), "temp", fileName);

    fs.writeFileSync(fileDir, JSON.stringify(busesToExport));

    return res.download(fileDir, fileName, () => {
      fs.unlinkSync(fileDir);
    });
  } else {
    res.status(400);
    throw new Error("cmd not found!");
  }
});

// @desc    Set alternate bus
// @route   POST /api/transport/bus/set-alternate
// @access  Private
const setAlternateBus = asyncHandler(async (req, res) => {
  const bus = req.body.bus;

  if (!bus) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus"));
  }

  const query = { name: bus.toUpperCase() };

  if (!(await Bus.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Id("bus", bus));
  }

  if (!req.body.alt_bus) {
    res.status(400);
    throw new Error(C.getFieldIsReq("alt_bus"));
  }

  const altBus = await Bus.findOne({ name: req.body.alt_bus.toUpperCase() })
    .select("_id")
    .lean();

  if (!altBus) {
    res.status(400);
    throw new Error(C.getResourse404Id("alt_bus", req.body.alt_bus));
  }

  const result = await Bus.updateOne(query, {
    $set: {
      alternate: { enabled: true, bus: altBus._id },
      status: { value: req.body.status || "NA", dt: new Date() },
    },
  });

  res.status(200).json(result);
});

// @desc    Set alternate bus
// @route   POST /api/transport/bus/unset-alternate
// @access  Private
const unsetAlternateBus = asyncHandler(async (req, res) => {
  const bus = req.body.bus;

  if (!bus) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus"));
  }

  const query = { name: bus.toUpperCase() };

  if (!(await Bus.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Id("bus", bus));
  }

  const result = await Bus.updateOne(query, {
    $set: {
      alternate: { enabled: false },
      status: { value: "none", dt: new Date() },
    },
  });

  res.status(200).json(result);
});

// @desc    Track buses
// @route   POST /api/transport/bus/track
// @access  Private
const trackBus = asyncHandler(async (req, res) => {
  const query = { _id: req.body.bus_ids };

  const result = [];

  const buses = await Bus.find(query).select("name temp_device device").lean();

  for (const bus of buses) {
    const device = await UC.getBusDevice(bus);

    result.push({
      name: bus.name,
      imei: device.imei,
      dt_server: new Date(
        device.dt_server.toISOString().replace("Z", "-05:30")
      ),
      dt_tracker: new Date(
        device.dt_tracker.toISOString().replace("Z", "-05:30")
      ),
      lat: device.lat,
      lon: device.lon,
      speed: device.speed,
      altitude: device.altitude,
      angle: device.angle,
      vehicle_status: device.vehicle_status,
      params: device.params,
      ignition: device.params.io239 === "1",
      icon: UC.getBusIcon(device),
    });
  }

  res.status(200).json(result);
});

// @desc    Get buses status
// @route   POST /api/transport/bus/status
// @access  Private
const getBusStatus = asyncHandler(async (req, res) => {
  const school = await UC.validateSchool(req.user, req.body.school);

  const buses = await Bus.find({ school }).select("name device").lean();

  const result = {
    total: buses.length,
    moving: 0,
    stopped: 0,
    idle: 0,
    offline: 0,
  };

  const timeout = parseInt(process.env.CONNECTION_TIMEOUT_MINUTES) * 60 * 1000;

  for (const bus of buses) {
    const dt_tracker = new Date(bus.device.dt_tracker);
    const speed = parseFloat(bus.device.speed);
    const ignition = bus.device.params.io239 === "1";

    const diff = new Date().getTime() - dt_tracker.getTime();

    if (diff > timeout) result.offline++;
    else if (speed > 0) result.moving++;
    else if (speed === 0 && ignition) result.idle++;
    else if (speed === 0 && !ignition) result.stopped++;
  }

  res.status(200).json(result);
});

// @desc    Switch bus device
// @route   POST /api/transport/bus/switch
// @access  Private
const switchBus = asyncHandler(async (req, res) => {
  const bus = req.body.bus;

  if (!bus) {
    res.status(400);
    throw new Error(C.getFieldIsReq("bus"));
  }

  const query = { name: bus.toUpperCase() };

  if (!(await Bus.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Id("bus", bus));
  }

  if (!req.body.temp_bus) {
    res.status(400);
    throw new Error(C.getFieldIsReq("temp_bus"));
  }

  const tempBus = await Bus.findOne({ name: req.body.temp_bus.toUpperCase() })
    .select("device.imei")
    .lean();

  if (!tempBus) {
    res.status(400);
    throw new Error(C.getResourse404Id("temp_bus", req.body.temp_bus));
  }

  const result = await Bus.updateOne(query, {
    $set: {
      temp_device: {
        enabled: true,
        imei: tempBus.device.imei,
        bus: tempBus._id,
      },
    },
  });

  res.status(200).json(result);
});

module.exports = {
  getBusStaffs,
  getBusStaff,
  addBusStaff,
  updateBusStaff,
  deleteBusStaff,
  bulkOpsBusStaff,

  getBusStops,
  getBusStop,
  addBusStop,
  updateBusStop,
  deleteBusStop,
  bulkOpsBusStop,

  getBuses,
  getBus,
  addBus,
  updateBus,
  deleteBus,
  bulkOpsBus,
  setAlternateBus,
  unsetAlternateBus,
  trackBus,
  getBusStatus,
  switchBus,
};
