const Line = require("../models/Line");
const ServicePoint = require("../models/ServicePoint");

const mongoose = require("mongoose");
const Plant = require("../models/Plant");
const Area = require("../models/Area");

const lineController = require("../controllers/lineController");

function buildSP(sp) {
  const { code, name, gate, insalubrity, steelmine, calory, dangerTask } = sp;
  return {
    id: sp._id,
    code,
    name,
    gate,
    insalubrity,
    steelmine,
    calory,
    dangerTask,
    lineId: sp.line._id,
    line: sp.line.name,
    area: sp.line.area.name,
    plant: sp.line.area.plant.name,
  };
}

const getAll = async (plantName) => {
  try {
    const plant = await Plant.findOne({ name: plantName });
    let spList = await ServicePoint.find({}).populate({
      path: "line",
      select: "name",
      populate: {
        path: "area",
        select: "name",
        populate: {
          path: "plant",
          select: "name",
        },
      },
    });
    if (plant)
      spList = spList.filter((sp) => sp.line.area.plant.name === plant.name);
    return spList.map(buildSP);
  } catch (e) {
    return { error: e.message };
  }
};

const getServicePoints = async (req, res) => {
  try {
    res.status(200).send(await getAll(req.query.plant));
  } catch (e) {
    res.status(400).send(await getAll(req.query.plant));
  }
};

// const locationMap = async() => {
//   const spList = await ServicePoint.find({})
//   .populate({path: 'line', select:'name', populate:{
//       path: 'area', select:'name', populate:{
//           path: 'plant', select: 'name'
//       }
//   }})
// const plantList = [...new Set(spList.map(sp=>sp.line.area.plant.name))]
// const plants = {}
// for (let plant of plantList){
//   const areas = {}
//   for (let area of [...new Set(spList.filter(sp=>sp.line.area.plant.name === plant).map(sp=>sp.line.area.name))]){
//     let lines = {}
//     for (let line of [...new Set(spList.filter(sp=>sp.line.area.name === area).map(sp=>sp.line.name))]){
//       lines[line] = [...new Set(spList.filter(sp=>sp.line.name === line).map(sp=>sp.name))]
//     }
//   areas[area]=lines
//   }
// plants[plant]=areas
// }

// return plants
// }

async function servicePointsByLine(req, res) {
  try {
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

async function addServicePoint(item) {
  const { name, lineId, lineCode, calory, dangerTask, steelMine, insalubrity } =
    item;
  try {
    const checkSP = await ServicePoint.find({ name, line: lineId });
    if (checkSP.length) throw new Error("El lugar de servicio ya existe");

    const lineSP = await ServicePoint.find({ line: lineId })
      .sort({ code: -1 })
      .limit(1);

    const lastCode = lineSP[0] ? parseInt(lineSP[0].code.match(/\d+$/)[0]) : 0;
    const nextCode = lastCode + 1;
    const code =
      lineCode +
      "-" +
      (nextCode + 1 < 10 ? "00" : nextCode < 100 ? "0" : "") +
      nextCode;

    const newItem = await ServicePoint({
      code,
      name,
      line: lineId,
      calory: calory || false,
      dangerTask: dangerTask || false,
      steelMine: steelMine || false,
      insalubrity: insalubrity || false,
    });
    const stored = await newItem.save();
    return stored;
  } catch (e) {
    return { name, error: e.message };
  }
}

async function findSPbyParents(sp) {
  const line = await lineController.findByNameAndParents(
    sp.line,
    sp.area,
    sp.plant
  );
  sp.name = sp.name || sp.servicePoint;
  sp.lineId = line._id;
  sp.lineCode = line.code;
  return sp;
}

async function addSPbyList(list) {
  const results = await Promise.all(
    list.map(async (item) => {
      const sp = await findSPbyParents(item);
      let result = await addServicePoint(sp);
      if (result.error) result = { ...sp, error: result.error };
      return result;
    })
  );
  return {
    success: results.filter((r) => !r.error),
    error: results.filter((r) => r.error),
  };
}

async function addSPFromApp(req, res) {
  let results = [];
  try {
    const { servPoints, lineCode } = req.body;
    if (servPoints && lineCode) {
      results = await Promise.all(
        servPoints.map(async (sp) => await addSP(sp, lineCode))
      );
    } else {
      results = await addSPbyList(req.body);
    }
    console.log("results", results);
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
      steelMine: servPoint.aceria,
      calory: servPoint.caloria,
      dangerTask: servPoint.tareaPeligrosa,
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
    const line = await Line.findOne({ ServicePoints: servicePoint._id });
    await line.ServicePoints.pull(servicePoint._id);
    await line.save();
    await ServicePoint.deleteOne({ name: servicePointName });
    return { success: true, name: servicePointName };
  } catch (e) {
    return { success: false, name: servicePointName, error: e.message };
  }
}

async function deleteOneServicePoint(req, res) {
  try {
    const servicePointName = req.body.name;
    let response = await deleteServicePoint(servicePointName);
    res.status(201).send({ response });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function getSPByName(req, res) {
  try {
    let { name } = req.params;
    let servicePoint = await ServicePoint.findOne({ name: name });
    let result = {
      name: servicePoint.name,
      code: servicePoint.code,
      gate: servicePoint.gate,
      aceria: servicePoint.steelMine,
      caloria: servicePoint.calory,
      tareaPeligrosa: servicePoint.dangerTask,
      insalubridad: servicePoint.insalubrity,
      devices: servicePoint.devices,
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
      newInsalubridad,
      oldName,
    } = req.body;
    const checkSP = await ServicePoint.find({ name: oldName }).lean().exec();
    if (checkSP.length > 0) {
      const spUpdated = await ServicePoint.updateOne(
        { name: oldName },
        {
          name: newName,
          code: newCode,
          gate: newGate,
          steelMine: newAceria,
          calory: newCaloria,
          dangerTask: newTareaPeligrosa,
          insalubrity: newInsalubridad,
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
  getAll,

  getServicePoints,

  servicePointsByLine,
  addSPFromApp,
  deleteOneServicePoint,
  getSPByName,
  updateServicePoint,
};
