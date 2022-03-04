const Line = require("../models/Line");
const ServicePoint = require("../models/ServicePoint");

const mongoose = require("mongoose");

async function servicePointsByLine(req, res) {
  try{
    const { lineName } = req.params;
    const lines = await Line.findOne({ name: lineName }).populate({
      path: "ServicePoints",
      select: "name",
    });
    res.status(200).send(lines.ServicePoints.map((sp) => sp.name));
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function addSPFromApp(req, res) {
  try{
    const { servPoints, lineCode } = req.body;
    let results = [];
    for (let servPoint of servPoints) {
      const result = await addSP(servPoint, lineCode);
      results = [...results, result];
    }
    res.status(200).send(results);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function addSP(servPoint, lineCode) {
  try {
    const serPoint = await ServicePoint({
      name: servPoint.name,
      code: servPoint.code,
      gate: servPoint.gate,
      aceria: servPoint.aceria,
      caloria: servPoint.caloria,
      tareaPeligrosa: servPoint.tareaPeligrosa,
    });
    const serPointStored = await serPoint.save();
    const lines = await Line.findOne({ code: lineCode });
    await lines.ServicePoints.push(mongoose.Types.ObjectId(serPointStored._id));
    await lines.save();
    return { success: true, SP: serPointStored };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function deleteServicePoint(servicePointName) {
  try {
    const servicePoint = await ServicePoint.findOne({ name: servicePointName });
    console.log("sp", servicePoint);
    const line = await Line.findOne({ ServicePoints: servicePoint._id });
    console.log("line", line);
    await line.ServicePoints.pull(servicePoint._id);
    await line.save();
    await ServicePoint.deleteOne({ name: servicePointName });
    return { success: true, name: servicePointName };
  } catch (e) {
    return { success: false, name: servicePointName, error: e.message };
  }
}

async function deleteOneServicePoint(req, res) {
  try{
    const servicePointName = req.body.name;
    let response = await deleteServicePoint(servicePointName);
    res.status(201).send({ response });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function getSPByName(req, res) {
  try{
    let { name } = req.params;
    let servicePoint = await ServicePoint.findOne({ name: name });
    let result = {
      name: servicePoint.name,
      code: servicePoint.code,
      gate: servicePoint.gate,
      aceria: servicePoint.aceria,
      caloria: servicePoint.caloria,
      tareaPeligrosa: servicePoint.tareaPeligrosa,
      devices: servicePoint.devices
    };
    res.status(200).send(result);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function updateServicePoint(req, res) {
  try {
    let {
      newName,
      newCode,
      newGate,
      newAceria,
      newCaloria,
      newTareaPeligrosa,
      oldName,
    } = req.body;
    const checkSP = await ServicePoint.find({ name: oldName }).lean().exec();
    console.log("req body", req.body);
    if (checkSP.length > 0) {
      const spUpdated = await ServicePoint.updateOne(
        { name: oldName },
        {
          name: newName,
          code: newCode,
          gate: newGate,
          aceria: newAceria,
          caloria: newCaloria,
          tareaPeligrosa: newTareaPeligrosa,
        }
      );
      res.status(201).send({ spUpdated });
    } else {
      res.status(400).send({ message: "El área no existe" });
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
}

module.exports = {
  servicePointsByLine,
  addSPFromApp,
  deleteOneServicePoint,
  getSPByName,
  updateServicePoint,
};
