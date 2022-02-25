const Plant = require("../models/Plant");
const Area = require("../models/Area");
const Line = require("../models/Line");
const Device = require("../models/Device");
const Refrigerante = require("../models/Refrigerant");
const ServicePoints = require("../models/ServicePoint");
const DeviceOptions = require("../models/DeviceOptions");
const mongoose = require("mongoose");

async function allDevices(req, res) {
  const { line, sp } = req.query;
  let devicesFound;
  if (sp !== "") {
    let spFound = await ServicePoints.findOne({ name: sp });
    devicesFound = await Device.find({ servicePoints: spFound._id });
  } else if (line !== "") {
    let lineFound = await Line.findOne({ name: line });
    devicesFound = await Device.find({ line: lineFound._id });
  }

  res.status(200).send(devicesFound);
}

async function getOptions(req, res) {
  res.status(200).send(await DeviceOptions.findOne({}));
}

async function createDevice(req, res) {
  const {
    name,
    type,
    magnitude,
    unit,
    extraDetails,
    service,
    status,
    category,
    regDate,
    environment,
    line,
    active,
    servicePoints,
    refrigerant,
    plant,
    area,
  } = req.body;
  try {
    const areafilter = (
      await Plant.findOne({ name: plant }).find().lean().exec()
    )
      .map((plant) => plant.areas)[0]
      .filter((element) => element.name === area);

    const lineFilter = (
      await Area.findOne({ name: areafilter[0].name }).lean().exec()
    ).lines;

    let lineData = [];

    for (element of lineFilter) {
      let lineElement = await Line.findOne({ _id: element });
      if (lineElement.name === line) lineData = lineElement;
    }

    let servicePointdata = [];

    for (elementSP of lineData.ServicePoints) {
      let spElement = await ServicePoints.findOne({ _id: elementSP });
      if (spElement.name === servicePoints) servicePointdata = spElement;
    }

    let devicesCharged = await Device.find({ line: lineData._id }).sort({
      code: -1,
    });
    let newCodeArray = "";

    if (devicesCharged.length !== 0)
      newCodeArray = devicesCharged[0].code.split("-");
    else newCodeArray = lineData.code + "-001";

    let newCode = "";

    if (devicesCharged.length !== 0)
      newCode =
        newCodeArray[0] + "-" + (parseInt(newCodeArray[1]) + 1).toString();
    else newCode = newCodeArray;

    let dateTransform = regDate.split("/").reverse().join("-") + "T00:00:00";
    let date = new Date(dateTransform);

    const newDevice = await Device({
      code: newCode,
      name: name,
      type: type,
      power: {
        magnitude: magnitude,
        unit: unit,
      },
      extraDetails: extraDetails,
      service: service,
      status: status,
      category: category,
      regDate: date,
      environment: environment,
      line: lineData._id,
      active: active === "true",
      servicePoints: servicePointdata._id,
      refrigerant: mongoose.Types.ObjectId(refrigerant),
    });

    let deviceStored = await newDevice.save();

    const checkSPDevices = await ServicePoints.find({
      _id: servicePointdata._id,
    })
      .lean()
      .exec();
    checkSPDevices[0].devices.push(deviceStored._id);
    console.log(checkSPDevices);

    if (checkSPDevices.length > 0) {
      await ServicePoints.updateOne(
        { _id: servicePointdata._id },
        { devices: checkSPDevices[0].devices }
      );
    }
    res.json("Equipo cargado con éxito!");
  } catch (e) {
    console.error(e.message);
    res.status(400).send({ error: e.message });
  }
}

async function deleteDevice(req, res) {
  try {
    const { id } = req.body;
    const checkDevice = await Device.find({
      _id: mongoose.Types.ObjectId(id),
    })
      .lean()
      .exec();
    if (checkDevice.length > 0) {
      let deviceID = checkDevice[0]._id;
      const deviceDeleted = await Device.deleteOne({ _id: deviceID });
      const checkSPDevices = await ServicePoints.find({
        devices: mongoose.Types.ObjectId(id),
      });
      checkSPDevices[0].devices.filter(
        (element) => element !== mongoose.Types.ObjectId(id)
      );
      await ServicePoints.updateOne(
        { _id: checkSPDevices[0]._id },
        { devices: checkSPDevices[0].devices }
      );
      res.status(201).send({ deviceDeleted });
    } else {
      res.status(400).send({ message: "La garrafa no existe" });
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
}

async function updateDevice(req, res) {
  try {
    const {
      _id,
      newname,
      newtype,
      newextraDetails,
      newservice,
      newstatus,
      newcategory,
      newenvironment,
      newactive,
      newrefrigerant,
    } = req.body;
    const checkDevice = await Device.find({
      _id: mongoose.Types.ObjectId(_id),
    })
      .lean()
      .exec();
    if (checkDevice.length > 0) {
      const deviceUpdated = await Device.updateOne(
        { _id: mongoose.Types.ObjectId(_id) },
        {
          name: newname,
          type: newtype,
          extraDetails: newextraDetails,
          service: newservice,
          status: newstatus,
          category: newcategory,
          environment: newenvironment,
          active: newactive,
          refrigerant: newrefrigerant,
        }
      );
      res.status(201).send({ deviceUpdated });
    } else {
      res.status(400).send({ message: "La garrafa no existe" });
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
}

module.exports = {
  allDevices,
  getOptions,
  createDevice,
  deleteDevice,
  updateDevice,
};
