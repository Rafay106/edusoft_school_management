const fs = require("node:fs");
const path = require("node:path");
const asyncHandler = require("express-async-handler");
const C = require("../constants");
const UC = require("../utils/common");
const BusStaff = require("../models/transport/busStaffModel");
const BusStop = require("../models/transport/busStopModel");
const Bus = require("../models/transport/busModel");
const Student = require("../models/studentInfo/studentModel");
const Class = require("../models/academics/classModel");
const Section = require("../models/academics/sectionModel");
const Device = require("../models/system/deviceModel");
const BusAssignment = require("../models/transport/busAssignModel");
const AcademicYear = require("../models/academics/academicYearModel");

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
    query["$or"] = searchQuery;
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

    // return res.json(fileData);

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
    query["$or"] = searchQuery;
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
    query["$or"] = searchQuery;
  }

  const results = await UC.paginatedQuery(
    Bus,
    query,
    "name device driver conductor",
    page,
    limit,
    sort,
    ["device driver conductor", "imei name"]
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a bus
// @route   GET /api/transport/bus/:id
// @access  Private
const getBus = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const bus = await Bus.findOne(query).populate("device").lean();

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
  const imei = req.body.imei;

  if (!imei) {
    res.status(400);
    throw new Error(C.getFieldIsReq("imei"));
  }

  const device = await Device.findOne({ imei }).select("_id").lean();

  if (!device) {
    res.status(400);
    throw new Error(C.getResourse404Id("imei", imei));
  }

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
    device: device._id,
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
    if (!(await BusStaff.any({ _id: driver, type: "d" }))) {
      res.status(400);
      throw new Error(C.getResourse404Id("driver", driver));
    }
  }

  if (conductor) {
    if (!(await BusStaff.any({ _id: conductor, type: "c" }))) {
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

    // return res.json(fileData);

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
  const query = {};

  const busNames = req.body.bus_names;
  if (busNames && busNames.length > 0) {
    const busIds = await UC.validateBusesFromName(busNames);

    query._id = busIds;
  }

  const result = [];

  const buses = await Bus.find(query)
    .select("name temp_device device")
    .populate("device")
    .lean();

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
    .select("device")
    .populate("device", "imei")
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

// @desc    Switch bus device
// @route   GET /api/transport/bus/reset
// @access  Private
const resetAllBus = asyncHandler(async (req, res) => {
  const tempBus = await Bus.updateMany(
    { "temp_device.enabled": true },
    { $set: { "temp_device.enabled": false } }
  );

  res.status(200).json(tempBus);
});

/** 4. BusAssignment */

// @desc    Get all bus-assigned
// @route   GET /api/transport/bus-assign
// @access  Private
const getBusAssigns = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "-createdAt";

  const query = {};
  const stuQuery = {
    academic_year: req.ayear,
    // bus_pick: { $type: "objectId" },
    // bus_drop: { $type: "objectId" },
    // bus_stop: { $type: "objectId" },
  };

  if (req.query.adm_no) {
    stuQuery.admission_no = req.query.adm_no.toUpperCase();
  }

  if (req.query.class_name) {
    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      req.query.class_name.split(","),
      req.ayear
    );

    stuQuery.class = classIds;
    stuQuery.section = secIds;
  }

  if (req.query.bus) {
    const busId = await UC.validateBusByName(req.query.bus, "bus");

    stuQuery.$or = [{ bus_pick: busId }, { bus_drop: budId }];
  }

  const students = await Student.find(stuQuery).select("_id").lean();

  query.student = students.map((ele) => ele._id);

  const populateConfigs = [
    {
      path: "student",
      select: "admission_no name roll_no",
      populate: { path: "class section", select: "name" },
    },
    {
      path: "list.bus_stop list.bus_pick list.bus_drop",
      select: "name",
    },
  ];

  const results = await UC.paginatedQueryProPlus(
    BusAssignment,
    query,
    "",
    page,
    limit,
    sort,
    populateConfigs
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a busAssign
// @route   GET /api/transport/bus-assign/:id
// @access  Private
const getBusAssign = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  const busAssign = await BusAssignment.findOne(query)
    .populate(
      "student list.bus_stop list.bus_pick list.bus_drop academic_year",
      "name title"
    )
    .lean();

  if (!busAssign) {
    res.status(404);
    throw new Error(C.getResourse404Id("BusAssignment", req.params.id));
  }

  busAssign.list.sort((a, b) => {
    if (a.date > b.date) return 1;
    if (a.date < b.date) return -1;
    return 0;
  });

  res.status(200).json(busAssign);
});

// @desc    Assign bus to student
// @route   POST /api/transport/assign-bus-to-student
// @access  Private
const assignBusToStudent = asyncHandler(async (req, res) => {
  if (!req.body.adm_no) {
    res.status(400);
    throw new Error(C.getFieldIsReq("adm_no"));
  }

  const admNo = req.body.adm_no.toUpperCase();

  const busStopId = await UC.validateBusStopByName(req.body.bus_stop);
  const busPickId = await UC.validateBusByName(req.body.bus_pick, "bus_pick");
  const busDropId = await UC.validateBusByName(req.body.bus_drop, "bus_drop");
  const doj = UC.validateAndSetDate(req.body.doj, "doj");
  const date = new Date(doj.setUTCDate(1));

  const academicYear = await AcademicYear.findById(req.ayear).lean();

  if (
    date.getTime() < academicYear.starting_date.getTime() ||
    date.getTime() > academicYear.ending_date.getTime()
  ) {
    res.status(400);

    const startdt = academicYear.starting_date.toISOString();
    const enddt = academicYear.ending_date.toISOString();

    throw new Error(
      `doj out of range of current academic year: ${startdt} - ${enddt}`
    );
  }

  const student = await Student.findOne({ admission_no: admNo })
    .select("_id")
    .lean();

  if (!student) {
    res.status(400);
    throw new Error(C.getResourse404Id("Student", req.body.adm_no));
  }

  const busAssign = await BusAssignment.findOne({
    student: student._id,
    academic_year: req.ayear,
  }).lean();

  let result;

  const list = [];
  const sortFunc = (a, b) => {
    if (a.month > b.month) return 1;
    if (a.month < b.month) return -1;
    return 0;
  };

  const month = date.getUTCMonth();
  const startMonth = academicYear.starting_date.getUTCMonth();

  const equation = (12 - (month - startMonth)) % 12;

  const limit = equation === 0 ? 12 : equation;

  for (let i = 0; i < limit; i++) {
    const monthToSet = month + i;
    const monthDate = new Date(
      new Date(new Date().setUTCHours(0, 0, 0, 0)).setUTCDate(1)
    );

    const data = {
      date: req.body.doj,
      month: new Date(monthDate.setUTCMonth(monthToSet)),
      status: C.ASSIGNED,
      bus_stop: busStopId,
      bus_pick: busPickId,
      bus_drop: busDropId,
      assigned_by: req.user._id,
    };

    list.push(data);
  }

  list.sort(sortFunc);

  if (!busAssign) {
    const newBusAssign = await BusAssignment.create({
      student: student._id,
      list,
      academic_year: req.ayear,
    });

    result = { msg: newBusAssign._id };
  } else {
    const updatedList = [];

    for (const assignData of busAssign.list) {
      const newData = list.find(
        (ele) => ele.month.getTime() === assignData.month.getTime()
      );

      if (newData) updatedList.push(newData);
      else updatedList.push(assignData);
    }

    const update = await BusAssignment.updateOne(
      { student: student._id, academic_year: req.ayear },
      { $set: { list: updatedList.sort(sortFunc) } }
    );

    result = update;
  }

  await Student.updateOne(
    { _id: student._id },
    {
      $set: {
        bus_stop: busStopId,
        bus_pick: busPickId,
        bus_drop: busDropId,
      },
    }
  );

  res.status(200).json(result);
});

// @desc    Bulk assign bus to student
// @route   POST /api/transport/assign-bus-to-student/bulk
// @access  Private
const bulkAssignBus = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error(C.getFieldIsReq("file"));
  }

  const fileData = UC.excelToJson(req.file.path);
  fs.unlinkSync(req.file.path);

  const academicYear = await AcademicYear.findById(req.ayear).lean();

  const busAssignData = [];
  const errors = [];

  let i = 2;
  for (const row of fileData) {
    const admission_no = row["ADM.NO"];
    const bus_stop = row["BUS STOPPAGE"];
    const bus_pick = String(row["BUS PICK"]);
    const bus_drop = String(row["BUS DROP"]);

    if (!admission_no) errors.push(C.getFieldIsReq("ADM.NO"));
    if (!bus_stop) errors.push(C.getFieldIsReq("BUS STOPPAGE"));
    if (!bus_pick) errors.push(C.getFieldIsReq("BUS PICK"));
    if (!bus_drop) errors.push(C.getFieldIsReq("BUS DROP"));
    if (!row["DOJ"]) errors.push(C.getFieldIsReq("DOJ"));

    const student = await Student.findOne({ admission_no })
      .select("_id")
      .lean();

    const stopName = bus_stop.trim().toUpperCase();

    const busStop = await BusStop.findOne({
      $or: [{ name: stopName }, { name: { $regex: stopName, $options: "i" } }],
    })
      .select("_id")
      .lean();
    const busPick = await Bus.findOne({ name: bus_pick.trim().toUpperCase() })
      .select("_id")
      .lean();
    const busDrop = await Bus.findOne({ name: bus_drop.trim().toUpperCase() })
      .select("_id")
      .lean();

    let isError = false;
    if (!student) {
      errors.push(`Student not found: '${admission_no}' at row: ${i}`);
      isError = true;
    }

    if (!busStop) {
      errors.push(
        `BUS STOPPAGE: '${bus_stop}' not found at row: ${i} of student: ${admission_no}`
      );
      isError = true;
    }

    if (!busPick) {
      errors.push(
        `Bus not found: '${bus_pick}' at row: ${i} of student: ${admission_no}`
      );
      isError = true;
    }

    if (!busDrop) {
      errors.push(
        `Bus not found: '${bus_drop}' at row: ${i} of student: ${admission_no}`
      );
      isError = true;
    }

    const doj = UC.excelDateToJSDate(row["DOJ"]);

    if (isNaN(doj)) {
      errors.push(
        `Invalid DOJ: '${row["DOJ"]}' at row: ${i} of student: ${admission_no}`
      );
      isError = true;
    }

    i++;
    if (isError) continue;

    busAssignData.push({
      student: student,
      bus_stop: busStop,
      bus_pick: busPick,
      bus_drop: busDrop,
      doj,
    });
  }

  // if (errors.length) {
  //   res.status(400);
  //   return res.json({ total: errors.length, msg: errors });
  // }

  const results = [];
  let createCount = 0;
  let updateCount = 0;

  for (const data of busAssignData) {
    const student = data.student;
    const busStop = data.bus_stop;
    const busPick = data.bus_pick;
    const busDrop = data.bus_drop;

    const busAssign = await BusAssignment.findOne({
      student: student._id,
      academic_year: req.ayear,
    }).lean();

    const list = [];
    const sortFunc = (a, b) => {
      if (a.month > b.month) return 1;
      if (a.month < b.month) return -1;
      return 0;
    };

    const doj = data.doj;
    const date = new Date(new Date(doj.setUTCHours(0, 0, 0, 0)).setUTCDate(1));

    if (
      date.getTime() < academicYear.starting_date.getTime() ||
      date.getTime() > academicYear.ending_date.getTime()
    ) {
      res.status(400);

      const startdt = academicYear.starting_date.toISOString();
      const enddt = academicYear.ending_date.toISOString();

      throw new Error(
        `DOJ out of range of current academic year: ${startdt} - ${enddt}`
      );
    }

    const month = date.getUTCMonth();
    const startMonth = academicYear.starting_date.getUTCMonth();

    const equation = (12 - (month - startMonth)) % 12;

    const limit = equation === 0 ? 12 : equation;

    for (let i = 0; i < limit; i++) {
      const monthToSet = month + i;
      const monthDate = new Date(
        new Date(new Date().setUTCHours(0, 0, 0, 0)).setUTCDate(1)
      );

      const listItem = {
        date: doj,
        month: new Date(monthDate.setUTCMonth(monthToSet)),
        status: C.ASSIGNED,
        bus_stop: busStop._id,
        bus_pick: busPick._id,
        bus_drop: busDrop._id,
        assigned_by: req.user._id,
      };

      list.push(listItem);
    }

    list.sort(sortFunc);

    if (!busAssign) {
      await BusAssignment.create({
        student: student._id,
        list,
        academic_year: req.ayear,
      });

      createCount++;
    } else {
      const updatedList = [];

      for (const assignData of busAssign.list) {
        const newData = list.find(
          (ele) => ele.month.getTime() === assignData.month.getTime()
        );

        if (newData) updatedList.push(newData);
        else updatedList.push(assignData);
      }

      await BusAssignment.updateOne(
        { student: student._id, academic_year: req.ayear },
        { $set: { list: updatedList.sort(sortFunc) } }
      );

      updateCount++;
    }

    await Student.updateOne(
      { _id: student._id },
      {
        $set: {
          bus_stop: busStop._id,
          bus_pick: busPick._id,
          bus_drop: busDrop._id,
        },
      }
    );

    results.push({
      admno: student.admission_no,
      busStop,
      busPick,
      busDrop,
      doj,
    });
  }

  res.json({
    createCount,
    updateCount,
    errorCount: errors.length,
    errors: errors.sort(),
  });
});

// @desc    Unassign bus to student
// @route   POST /api/transport/unassign-bus-to-student
// @access  Private
const unassignBusToStudent = asyncHandler(async (req, res) => {
  if (!req.body.adm_no) {
    res.status(400);
    throw new Error(C.getFieldIsReq("adm_no"));
  }

  const admNo = req.body.adm_no.toUpperCase();
  const dor = UC.validateDate(req.body.dor, "dor");

  const date = new Date(dor.setUTCDate(1));

  const academicYear = await AcademicYear.findById(req.ayear).lean();

  if (
    date.getTime() < academicYear.starting_date.getTime() ||
    date.getTime() > academicYear.ending_date.getTime()
  ) {
    res.status(400);

    const startdt = academicYear.starting_date.toISOString();
    const enddt = academicYear.ending_date.toISOString();

    throw new Error(
      `dor out of range of current academic year: ${startdt} - ${enddt}`
    );
  }

  const student = await Student.findOne({ admission_no: admNo })
    .select("_id")
    .lean();

  if (!student) {
    res.status(400);
    throw new Error(C.getResourse404Id("Student", req.body.adm_no));
  }

  const busAssign = await BusAssignment.findOne({
    student: student._id,
    academic_year: req.ayear,
  }).lean();

  if (!busAssign) {
    res.status(400);
    throw new Error(`Student (${admNo}) has never been assigned bus before.`);
  }

  const list = [];
  const sortFunc = (a, b) => {
    if (a.month > b.month) return 1;
    if (a.month < b.month) return -1;
    return 0;
  };

  const now = new Date();
  const month =
    date.getUTCMonth() <= now.getUTCMonth()
      ? now.getUTCMonth() + 1
      : date.getUTCMonth();

  const startMonth = academicYear.starting_date.getUTCMonth();

  const equation = (12 - (month - startMonth)) % 12;

  const limit = equation === 0 ? 12 : equation;

  for (let i = 0; i < limit; i++) {
    const monthToSet = month + i;
    const monthDate = new Date(
      new Date(new Date().setUTCHours(0, 0, 0, 0)).setUTCDate(1)
    );
    const data = {
      date: new Date(req.body.dor),
      month: new Date(monthDate.setUTCMonth(monthToSet)),
      status: C.UNASSIGNED,
      released_by: req.user._id,
    };

    // const currStatus = busAssign.list.find(
    //   (ele) =>
    //     ele.month.getTime() === data.month.getTime() &&
    //     ele.status === C.ASSIGNED
    // );

    // if (currStatus && now.getUTCMonth() >= data.month.getUTCMonth()) {
    //   data.month.setUTCMonth(data.month.getUTCMonth() + 1);
    // }

    list.push(data);
  }

  const updatedList = [];

  for (const assignData of busAssign.list) {
    const newData = list.find(
      (ele) => ele.month.getTime() === assignData.month.getTime()
    );

    if (newData) updatedList.push(newData);
    else updatedList.push(assignData);
  }

  const update = await BusAssignment.updateOne(
    { student: student._id, academic_year: req.ayear },
    { $set: { list: updatedList.sort(sortFunc) } }
  );

  const studentToUpdate = await Student.findById({ _id: student._id }).select(
    "bus_stop bus_pick bus_drop"
  );

  studentToUpdate.set("bus_stop", undefined, { strict: false });
  studentToUpdate.set("bus_pick", undefined, { strict: false });
  studentToUpdate.set("bus_drop", undefined, { strict: false });

  await studentToUpdate.save();

  res.status(200).json(update);
});

// @desc    Bulk unassign bus to student
// @route   POST /api/transport/unassign-bus-to-student/bulk
// @access  Private
const bulkUnassignBus = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error(C.getFieldIsReq("file"));
  }

  const fileData = UC.excelToJson(req.file.path);
  fs.unlinkSync(req.file.path);

  const academicYear = await AcademicYear.findById(req.ayear).lean();

  const results = [];
  let updateCount = 0;

  let i = 2;
  for (const row of fileData) {
    if (!row["admission_no"]) {
      res.status(400);
      throw new Error("Column is required: admission_no");
    }

    if (!row["date_of_release"]) {
      res.status(400);
      throw new Error("Column is required: date_of_release");
    }

    const admission_no = row["admission_no"];
    const dor = UC.excelDateToJSDate(row["date_of_release"]);

    const date = new Date(dor.setUTCDate(1));

    const student = await Student.findOne({ admission_no })
      .select("_id")
      .lean();

    if (!student) {
      res.status(400);
      throw new Error(`Student not found: ${admission_no} at row: ${i}`);
    }

    const busAssign = await BusAssignment.findOne({
      student: student._id,
      academic_year: req.ayear,
    }).lean();

    if (!busAssign) {
      res.status(400);
      throw new Error(
        `Student (${admission_no}) has never been assigned bus before.`
      );
    }

    const list = [];
    const sortFunc = (a, b) => {
      if (a.month > b.month) return 1;
      if (a.month < b.month) return -1;
      return 0;
    };

    const month =
      date.getUTCMonth() <= now.getUTCMonth()
        ? now.getUTCMonth() + 1
        : date.getUTCMonth();

    const startMonth = academicYear.starting_date.getUTCMonth();

    const equation = (12 - (month - startMonth)) % 12;

    const limit = equation === 0 ? 12 : equation;

    const now = new Date();
    for (let i = 0; i < limit; i++) {
      const monthToSet = month + i;
      const monthDate = new Date(
        new Date(new Date().setUTCHours(0, 0, 0, 0)).setUTCDate(1)
      );
      const data = {
        date: dor,
        month: new Date(monthDate.setUTCMonth(monthToSet)),
        status: C.UNASSIGNED,
        released_by: req.user._id,
      };

      const currStatus = busAssign.list.find(
        (ele) =>
          ele.month.getTime() === data.month.getTime() &&
          ele.status === C.ASSIGNED
      );

      if (
        currStatus &&
        now.getUTCFullYear() >= data.month.getUTCFullYear() &&
        now.getUTCMonth() >= data.month.getUTCMonth()
      ) {
        continue;
      }

      list.push(data);
    }

    const updatedList = [];

    for (const assignData of busAssign.list) {
      const newData = list.find(
        (ele) => ele.month.getTime() === assignData.month.getTime()
      );

      if (newData) updatedList.push(newData);
      else updatedList.push(assignData);
    }

    const update = await BusAssignment.updateOne(
      { student: student._id, academic_year: req.ayear },
      { $set: { list: updatedList.sort(sortFunc) } }
    );

    const studentToUpdate = await Student.findById({ _id: student._id }).select(
      "bus_stop bus_pick bus_drop"
    );

    studentToUpdate.set("bus_stop", undefined, { strict: false });
    studentToUpdate.set("bus_pick", undefined, { strict: false });
    studentToUpdate.set("bus_drop", undefined, { strict: false });

    await studentToUpdate.save();

    results.push(update);
    updateCount++;

    i++;
  }

  return res.json({ updateCount, results });
});

/** 4. Reports */

// @desc    Get reprot on student bus assignments
// @route   GET /api/transport/reports/bus-assign
// @access  Private
const reportBusAssign = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "admission_no";
  const sortOrd = req.query.sort_order || "asc";

  const query = {};
  const stuQuery = {
    academic_year: req.ayear,
    bus_pick: { $type: "objectId" },
    bus_drop: { $type: "objectId" },
    bus_stop: { $type: "objectId" },
  };

  if (req.query.adm_no) {
    stuQuery.admission_no = req.query.adm_no.toUpperCase();
  }

  if (req.query.class_name) {
    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      req.query.class_name.split(","),
      req.ayear
    );

    stuQuery.class = classIds;
    stuQuery.section = secIds;
  }

  const students = await Student.find(stuQuery).select("_id").lean();

  query.student = students.map((ele) => ele._id);

  if (req.query.bus_stop) {
    const busStopId = await UC.validateBusStopByName(
      req.query.bus_stop,
      "bus_stop"
    );

    query["list.bus_stop"] = busStopId;
  }

  if (req.query.bus) {
    const busId = await UC.validateBusByName(req.query.bus, "bus");

    query.$or = [{ "list.bus_pick": busId }, { "list.bus_drop": busId }];
  }

  if (req.query.from) {
    const from = UC.validateAndSetDate(req.query.from, "from");

    query.list = { $gte: { date: from } };
  }

  if (req.query.to) {
    const to = UC.validateAndSetDate(req.query.to, "to");

    if (query.list) query.list.$lte = { date: to };
    else query.list = { $lte: { date: to } };
  }

  const busAssignments = await BusAssignment.find(query)
    .populate({
      path: "student",
      select: "admission_no name roll_no phone",
      populate: { path: "class section stream", select: "name" },
    })
    .populate({
      path: "list.bus_pick list.bus_drop list.released_by",
      select: "name",
    })
    .populate({
      path: "list.bus_stop",
      select: "name monthly_charges",
    })
    .lean();

  const report = [];
  for (const data of busAssignments) {
    const student = data.student;
    const streamName = student.stream.name;
    const className = student.class.name;

    const reportData = {
      admission_no: student.admission_no,
      student_name: student.name,
      class: className + (streamName === "NA" ? "" : ` ${streamName}`),
      section: student.section.name,
      roll_no: student.roll_no,
      phone_number: student.phone,
    };

    let lastData = {};
    for (const assign of data.list) {
      if (assign.status !== C.ASSIGNED) continue;

      const currData = {
        date_of_joining: UC.formatDate(assign.date),
        bus_stop: assign.bus_stop.name,
        bus_pick: assign.bus_pick.name,
        bus_drop: assign.bus_drop.name,
        bus_charges: assign.bus_stop.monthly_charges,
        assigned_by: assign.assigned_by.name,
      };

      const isStatusSame = lastData?.status === currData.status;
      const isDateSame = lastData?.date_of_joining === currData.date_of_joining;
      const isBusStopSame = lastData?.bus_stop === currData.bus_stop;
      const isBusPickSame = lastData?.bus_pick === currData.bus_pick;
      const isBusDropSame = lastData?.bus_drop === currData.bus_drop;
      const isAssignedBySame = lastData?.assigned_by === currData.assigned_by;
      const isAllSame =
        isStatusSame &&
        isDateSame &&
        isBusStopSame &&
        isBusPickSame &&
        isBusDropSame &&
        isAssignedBySame;

      // console.log("isStatusSame :>> ", isStatusSame);
      // console.log("isDateSame :>> ", isDateSame);
      // console.log("isBusStopSame :>> ", isBusStopSame);
      // console.log("isBusPickSame :>> ", isBusPickSame);
      // console.log("isBusDropSame :>> ", isBusDropSame);
      // console.log("isAssignedBySame :>> ", isAssignedBySame);
      // console.log("isAllSame :>> ", isAllSame);

      if (!isAllSame) {
        report.push({
          ...reportData,
          ...currData,
        });
      }

      lastData = { ...currData };
    }
  }

  const total = report.length;
  const pages = Math.ceil(total / limit) || 1;
  if (page > pages) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  const startIdx = (page - 1) * limit;
  const results = { total, pages, page, result: [] };

  results.result = report
    .sort((a, b) => {
      if (sortOrd === "desc") {
        if (a[sort] < b[sort]) return 1;
        if (a[sort] > b[sort]) return -1;
        return 0;
      } else {
        if (a[sort] > b[sort]) return 1;
        if (a[sort] < b[sort]) return -1;
        return 0;
      }
    })
    .slice(startIdx, startIdx + limit);

  res.status(200).json(results);
});

// @desc    Get reprot on student bus un-assignments
// @route   GET /api/transport/reports/bus-unassign
// @access  Private
const reportBusUnassign = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "admission_no";
  const sortOrd = req.query.sort_order || "asc";

  const query = {};
  const stuQuery = {
    academic_year: req.ayear,
    // bus_pick: { $type: "objectId" },
    // bus_drop: { $type: "objectId" },
    // bus_stop: { $type: "objectId" },
  };

  if (req.query.adm_no) {
    stuQuery.admission_no = req.query.adm_no.toUpperCase();
  }

  if (req.query.class_name) {
    const [classIds, secIds] = await UC.getClassesNSectionsIdsFromNames(
      req.query.class_name.split(","),
      req.ayear
    );

    stuQuery.class = classIds;
    stuQuery.section = secIds;
  }

  const students = await Student.find(stuQuery).select("_id").lean();

  query.student = students.map((ele) => ele._id);

  if (req.query.bus_stop) {
    const busStopId = await UC.validateBusStopByName(
      req.query.bus_stop,
      "bus_stop"
    );

    query["list.bus_stop"] = busStopId;
  }

  if (req.query.bus) {
    const busId = await UC.validateBusByName(req.query.bus, "bus");

    query.$or = [{ "list.bus_pick": busId }, { "list.bus_drop": busId }];
  }

  if (req.query.from) {
    const from = UC.validateAndSetDate(req.query.from, "from");

    query.list = { $gte: { date: from } };
  }

  if (req.query.to) {
    const to = UC.validateAndSetDate(req.query.to, "to");

    if (query.list) query.list.$lte = { date: to };
    else query.list = { $lte: { date: to } };
  }

  const busAssignments = await BusAssignment.find(query)
    .populate({
      path: "student",
      select: "admission_no name roll_no phone",
      populate: { path: "class section stream", select: "name" },
    })
    .populate({
      path: "list.released_by",
      select: "name",
    })
    .lean();

  const report = [];
  for (const data of busAssignments) {
    const student = data.student;
    const streamName = student.stream.name;
    const className = student.class.name;

    const reportData = {
      admission_no: student.admission_no,
      student_name: student.name,
      class: className + (streamName === "NA" ? "" : ` ${streamName}`),
      section: student.section.name,
      roll_no: student.roll_no,
      phone_number: student.phone,
    };

    let lastData = {};
    for (const unassign of data.list) {
      if (unassign.status !== C.UNASSIGNED) continue;

      const currData = {
        date_of_release: UC.formatDate(unassign.date),
        released_by: unassign.released_by.name,
      };

      const isStatusSame = lastData?.status === currData.status;
      const isDateSame = lastData?.date_of_release === currData.date_of_release;
      const isReleasedBySame = lastData?.released_by === currData.released_by;

      const isAllSame = isStatusSame && isDateSame && isReleasedBySame;

      if (!isAllSame) {
        report.push({
          ...reportData,
          ...currData,
        });
      }

      lastData = { ...currData };
    }
  }

  const total = report.length;
  const pages = Math.ceil(total / limit) || 1;
  if (page > pages) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  const startIdx = (page - 1) * limit;
  const results = { total, pages, page, result: [] };

  results.result = report
    .sort((a, b) => {
      if (sortOrd === "desc") {
        if (a[sort] < b[sort]) return 1;
        if (a[sort] > b[sort]) return -1;
        return 0;
      } else {
        if (a[sort] > b[sort]) return 1;
        if (a[sort] < b[sort]) return -1;
        return 0;
      }
    })
    .slice(startIdx, startIdx + limit);

  res.status(200).json(results);
});

// @desc    For DPS: Import transport details from excel
// @route   GET /api/transport/import-transport-details
// @access  Private
const importStudentTransportDetails = asyncHandler(async (req, res) => {
  const fileData = UC.excelToJson(req.file.path);
  fs.unlinkSync(path.join(req.file.path));

  const CLASSES = await Class.find().select("name").lean();
  const SECTIONS = await Section.find().select("name").lean();
  const BUSES = await Bus.find().select("name").lean();
  const STOPS = await BusStop.find().lean();

  const errors = [];
  const students = [];

  let i = 1;
  for (const row of fileData) {
    const c = CLASSES.find((e) => e.name === row["Class"]);
    const section = SECTIONS.find((e) => e.name === row["Section"]);
    const busp = BUSES.find((e) => e.name === row["Pick Bus"]);
    const busd = BUSES.find((e) => e.name === row["Drop Bus"]);
    const busStop = STOPS.find((e) => e.name === row["Stop"]);

    if (!row["Adm.No"])
      errors.push(`Adm.No: ${row["Adm.No"]} not found at row: ${i}`);
    if (!c) errors.push(`Class: ${row["Class"]} not found at row: ${i}`);
    if (!section)
      errors.push(`Section: ${row["Section"]} not found at row: ${i}`);
    if (!busp)
      errors.push(`Pick Bus: ${row["Pick Bus"]} not found at row: ${i}`);
    if (!busd)
      errors.push(`Drop Bus: ${row["Drop Bus"]} not found at row: ${i}`);
    if (!busStop) errors.push(`Stop: ${row["Stop"]} not found at row: ${i}`);

    students.push({
      admission_no: row["Adm.No"],
      roll_no: row["Roll No."],
      name: row["Student Name"],
      class: c?._id,
      section: section?._id,
      phone: row["Phone Number"],
      bus_pick: busp?._id,
      bus_drop: busd?._id,
      bus_stop: busStop?._id,
    });

    i++;
  }

  for (const st of students) {
    if (!(await Student.any({ admission_no: st.admission_no }))) {
      errors.push(`Student: ${st.admission_no} is not added!`);
    }
  }

  if (errors.length) {
    return res.status(400).json(errors);
  }

  const result = [];
  for (const st of students) {
    const update = await Student.updateOne(
      { admission_no: st.admission_no },
      { $set: st }
    );

    result.push(update);
  }

  res.json({ total: result.length, msg: result });
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
  resetAllBus,

  getBusAssigns,
  getBusAssign,
  assignBusToStudent,
  bulkAssignBus,
  unassignBusToStudent,
  bulkUnassignBus,

  reportBusAssign,
  reportBusUnassign,

  importStudentTransportDetails,
};
