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
  const searchField = req.query.sf || "all";
  const searchValue = req.query.sv;

  const query = {};

  if (C.isManager(req.user.type)) query.manager = req.user._id;
  else if (C.isSchool(req.user.type)) query.school = req.user._id;

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = ["name"];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  const results = await UC.paginatedQuery(
    BusStaff,
    query,
    "type name",
    page,
    limit,
    sort
  );

  if (!results) return res.status(200).json({ msg: C.PAGE_LIMIT_REACHED });

  res.status(200).json(results);
});

// @desc    Get a busStaff
// @route   GET /api/transport/bus-staff/:id
// @access  Private
const getBusStaff = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const busStaff = await BusStaff.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!busStaff) {
    res.status(404);
    throw new Error(C.getResourse404Error("BusStaff", req.params.id));
  }

  res.status(200).json(busStaff);
});

// @desc    Add a busStaff
// @route   POST /api/transport/bus-staff
// @access  Private
const addBusStaff = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await User.any({ _id: manager, type: C.MANAGER }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await User.any({ _id: school, type: C.SCHOOL, manager }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  const name = {
    f: req.body.fname,
    m: req.body.mname,
    l: req.body.lname,
  };

  const driving_license = {
    number: req.body.dl_no,
    expiry_date: req.body.dl_exp,
  };

  const busStaff = await BusStaff.create({
    type: req.body.type,
    name,
    doj: req.body.doj,
    email: req.body.email,
    phone: req.body.phone,
    photo: req.body.photo,
    driving_license,
    manager,
    school,
  });

  res.status(201).json({ msg: busStaff._id });
});

// @desc    Update a busStaff
// @route   PUT /api/transport/bus-staff/:id
// @access  Private
const updateBusStaff = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  }

  if (C.isManager(req.user.type)) {
    query.manager = req.user._id;
  }

  const busStaff = await BusStaff.findOne(query).select("_id").lean();

  if (!busStaff) {
    res.status(404);
    throw new Error(C.getResourse404Error("BusStaff", req.params.id));
  }

  const result = await BusStaff.updateOne(query, {
    $set: {
      name: req.body.name,
      "device.name": req.body.device.name,
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

  if (C.isSchool(req.user.type)) {
    query.school = req.user._id;
    query.manager = req.user.manager;
  } else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const staff = await BusStaff.findOne(query).select("_id").lean();

  if (!staff) {
    res.status(400);
    throw new Error(C.getResourse404Error("BusStaff", req.params.id));
  }

  if (
    await Bus.any({ $or: [{ driver: staff._id }, { conductor: staff._id }] })
  ) {
    res.status(400);
    throw new Error(C.getUnableToDel("BusStaff", "Bus"));
  }

  const result = await BusStaff.deleteOne(query);

  res.status(200).json(result);
});

/** 2. BusStop */

// @desc    Get all bus stops
// @route   GET /api/transport/bus-stop
// @access  Private
const getBusStops = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf || "all";
  const searchValue = req.query.sv;

  const query = {};

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = ["name", "address"];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
  }

  const results = await UC.paginatedQuery(
    BusStop,
    query,
    "name address",
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

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const busStop = await BusStop.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!busStop) {
    res.status(404);
    throw new Error(C.getResourse404Error("BusStop", req.params.id));
  }

  res.status(200).json(busStop);
});

// @desc    Add a bus-stop
// @route   POST /api/transport/bus-stop
// @access  Private
const addBusStop = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await User.any({ _id: school, type: C.SCHOOL, manager }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  if (!(await User.any({ _id: manager, type: C.MANAGER }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  const busStop = await BusStop.create({
    name: req.body.name,
    address: req.body.address,
    fare: req.body.fare,
    lat: parseFloat(req.body.lat).toFixed(6),
    lon: parseFloat(req.body.lon).toFixed(6),
    manager,
    school,
  });

  res.status(201).json({ msg: busStop._id });
});

// @desc    Update a bus-stop
// @route   PATCH /api/transport/bus-stop/:id
// @access  Private
const updateBusStop = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (!(await BusStop.any(query))) {
    res.status(404);
    throw new Error(C.getResourse404Error("BusStop", req.params.id));
  }

  const result = await BusStop.updateOne(query, {
    $set: {
      name: req.body.name,
      address: req.body.address,
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

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const stop = await BusStop.findOne(query).select("_id").lean();

  if (!stop) {
    res.status(400);
    throw new Error(C.getResourse404Error("BusStop", req.params.id));
  }

  if (await Bus.any({ stops: stop._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("BusStop", "Bus"));
  }

  const result = await BusStop.deleteOne(query);

  res.status(200).json(result);
});

/** 3. Bus */

// @desc    Get all buses
// @route   GET /api/transport/bus
// @access  Private
const getBuses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.rows) || 10;
  const sort = req.query.sort || "name";
  const searchField = req.query.sf || "all";
  const searchValue = req.query.sv;

  const query = {};

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  if (searchField && searchValue) {
    if (searchField === "all") {
      const fields = ["name"];

      const searchQuery = UC.createSearchQuery(fields, searchValue);
      query["$or"] = searchQuery["$or"];
    } else {
      const searchQuery = UC.createSearchQuery([searchField], searchValue);
      query["$or"] = searchQuery["$or"];
    }
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

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const bus = await Bus.findOne(query)
    .populate("manager school", "name")
    .lean();

  if (!bus) {
    res.status(404);
    throw new Error(C.getResourse404Error("Bus", req.params.id));
  }

  res.status(200).json(bus);
});

// @desc    Add a bus
// @route   POST /api/transport/bus
// @access  Private
const addBus = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;
  const stops = req.body.stops;
  const driver = req.body.driver;
  const conductor = req.body.conductor;

  if (!stops || stops.length < 1) {
    res.status(400);
    throw new Error(C.getFieldIsReq("stops"));
  }

  if (C.isSchool(req.user.type)) {
    school = req.user._id;
    manager = req.user.manager;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!(await User.any({ _id: manager, type: C.MANAGER }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!(await User.any({ _id: school, type: C.SCHOOL, manager }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("school", school));
  }

  if (!(await BusStaff.any({ _id: driver, type: "d", manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("driver", driver));
  }

  if (!(await BusStaff.any({ _id: conductor, type: "c", manager, school }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("conductor", conductor));
  }

  for (const stop of stops) {
    if (!(await BusStop.any({ _id: stop, school }))) {
      res.status(400);
      throw new Error(C.getResourse404Error("stop", stop));
    }
  }

  const bus = await Bus.create({
    name: req.body.name,
    no_plate: req.body.no_plate,
    model: req.body.model,
    year_made: req.body.year_made,
    device: req.body.device,
    mobile: req.body.mobile,
    stops,
    driver,
    conductor,
    manager,
    school,
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

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

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
          throw new Error(C.getResourse404Error("stops", stop));
        }
      }
    }
  }

  if (driver) {
    if (!(await BusStaff.any({ ...query, _id: driver, type: "d" }))) {
      res.status(400);
      throw new Error(C.getResourse404Error("driver", driver));
    }
  }

  if (conductor) {
    if (!(await BusStaff.any({ ...query, _id: conductor, type: "c" }))) {
      res.status(400);
      throw new Error(C.getResourse404Error("conductor", conductor));
    }
  }

  const bus = await Bus.findOne(query).select("_id").lean();

  if (!bus) {
    res.status(404);
    throw new Error(C.getResourse404Error("Bus", req.params.id));
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

  if (C.isSchool(req.user.type)) query.school = req.user._id;
  else if (C.isManager(req.user.type)) query.manager = req.user._id;

  const bus = await Bus.findOne(query).select("_id").lean();

  if (!bus) {
    res.status(400);
    throw new Error(C.getResourse404Error("Bus", req.params.id));
  }

  if (await Student.any({ bus: bus._id })) {
    res.status(400);
    throw new Error(C.getUnableToDel("Bus", "Student"));
  }

  const result = await Bus.deleteOne(query);

  res.status(200).json(result);
});

// @desc    Set alternate bus
// @route   POST /api/transport/bus/:id/set-alternate
// @access  Private
const setAlternateBus = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;

  if (C.isSchool(req.user.type)) {
    manager = req.user.manager;
    school = req.user._id;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!UC.managerExists(manager)) {
    res.status(200);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!UC.schoolAccExists(school, manager)) {
    res.status(200);
    throw new Error(C.getResourse404Error("school", school));
  }

  const query = { _id: req.params.id, manager, school };

  if (!(await Bus.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Bus", req.params.id));
  }

  if (!req.body.alt_bus) {
    res.status(400);
    throw new Error(C.getFieldIsReq("alt_bus"));
  }

  if (!(await Bus.any({ ...query, _id: req.body.alt_bus }))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Bus", req.body.alt_bus));
  }

  if (!req.body.status) {
    res.status(400);
    throw new Error(C.getFieldIsReq("status"));
  }

  const result = await Bus.updateOne(query, {
    $set: {
      alternate: { enabled: true, bus: req.body.alt_bus },
      status: { value: req.body.status, dt: new Date() },
    },
  });

  res.status(200).json(result);
});

// @desc    Set alternate bus
// @route   POST /api/transport/bus/:id/unset-alternate
// @access  Private
const unsetAlternateBus = asyncHandler(async (req, res) => {
  let manager = req.body.manager;
  let school = req.body.school;

  if (C.isSchool(req.user.type)) {
    manager = req.user.manager;
    school = req.user._id;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!UC.managerExists(manager)) {
    res.status(200);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!UC.schoolAccExists(school, manager)) {
    res.status(200);
    throw new Error(C.getResourse404Error("school", school));
  }

  const query = { _id: req.params.id, manager, school };

  if (!(await Bus.any(query))) {
    res.status(400);
    throw new Error(C.getResourse404Error("Bus", req.params.id));
  }

  const result = await Bus.updateOne(query, {
    $set: {
      alternate: { enabled: false },
      status: { value: "", dt: new Date() },
    },
  });

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

  if (cmd === "import") {
    const fileData = JSON.parse(req.file.buffer.toString("utf8"));

    const result = await UC.addMultipleBuses(req.user._id, fileData);

    if (result.status === 400) {
      res.status(result.status);
      throw new Error(result.body);
    }

    return res.status(200).json({ msg: result.msg });
  }

  if (!buses) {
    res.status(400);
    throw new Error(C.getFieldIsReq("buses"));
  }

  if (buses.length === 0) {
    res.status(400);
    throw new Error("buses array is empty!");
  }

  if (cmd === "delete") {
    const result = await Bus.deleteMany({
      _id: buses,
      createdBy: req.user._id,
    });

    return res.status(200).json({ ...result });
  } else if (cmd === "export-json") {
    const busesToExport = await Bus.find({
      _id: buses,
      createdBy: req.user._id,
    })
      .select("-createdAt -updatedAt")
      .sort("name")
      .lean();

    const dt = new Date();
    const Y = String(dt.getUTCFullYear()).padStart(2, "0");
    const M = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const D = String(dt.getUTCDate()).padStart(2, "0");

    const fileName = `Bus_${Y}-${M}-${D}.json`;
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

// @desc    Track buses
// @route   POST /api/transport/bus/track
// @access  Private
const trackBus = asyncHandler(async (req, res) => {
  const ids = req.body.ids;
  let manager = req.body.manager;
  let school = req.body.school;
  const result = [];

  if (C.isSchool(req.user.type)) {
    manager = req.user.manager;
    school = req.user._id;
  } else if (C.isManager(req.user.type)) manager = req.user._id;

  if (!UC.managerExists(manager)) {
    res.status(200);
    throw new Error(C.getResourse404Error("manager", manager));
  }

  if (!UC.schoolAccExists(school, manager)) {
    res.status(200);
    throw new Error(C.getResourse404Error("school", school));
  }

  const buses = await Bus.find({ _id: ids, manager, school })
    .select("name alternate device")
    .lean();

  for (const bus of buses) {
    let bus_ = bus;
    if (bus.alternate.enabled) {
      const altBus = await Bus.findById(bus.alternate.bus)
        .select("name alternate device")
        .lean();

      bus_ = altBus;
    }
    result.push({
      name: bus_.name,
      imei: bus_.device.imei,
      dt_server: bus_.device.dt_server,
      dt_tracker: bus_.device.dt_tracker,
      lat: bus_.device.lat,
      lon: bus_.device.lon,
      speed: bus_.device.speed,
      altitude: bus_.device.altitude,
      angle: bus_.device.angle,
      params: bus_.device.params,
    });
  }

  res.status(200).json(result);
});

module.exports = {
  getBusStaffs,
  getBusStaff,
  addBusStaff,
  updateBusStaff,
  deleteBusStaff,

  getBusStops,
  getBusStop,
  addBusStop,
  updateBusStop,
  deleteBusStop,

  getBuses,
  getBus,
  addBus,
  updateBus,
  deleteBus,
  setAlternateBus,
  unsetAlternateBus,
  bulkOpsBus,
  trackBus,
};
