const Area = require("../models/Area");
const Plant = require("../models/Plant");
const Line = require("../models/Line");
const plantController = require("../controllers/plantController");
const mongoose = require("mongoose");

async function getAreaByNameAndParents(areaName, plantName) {
  const plant = await plantController.getByName(plantName);
  const area = await Area.findOne({ name: areaName, plant: plant._id });
  return area;
}

async function addArea(areaName, areaCode, plantCode) {
  try {
    const plant = await Plant.findOne({ code: plantCode });
    const area = await Area({
      name: areaName,
      code: areaCode,
      plant: plant._id,
    });
    const areaStored = await area.save();
    await plant.areas.push(mongoose.Types.ObjectId(areaStored._id));
    await plant.save();
    return { success: true, area: areaStored };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function addAreaFromApp(req, res) {
  try {
    const { areas } = req.body;
    const plants = await Plant.find({
      name: areas.map((a) => a.plant.name),
    });
    const newAreas = await Promise.all(
      plants.map(async (plant) => {
        const checkAreas = await Area.find({
          $or: [
            {
              name: areas.map((a) => a.name),
            },
            {
              code: areas.map((a) => a.code),
            },
          ],
          plant: plant._id,
        });
        if (checkAreas.length > 0)
          throw new Error(
            "'" +
              checkAreas.map((a) => plant.name + ">" + a.name).join(", ") +
              "' ya existe(n) en base de datos"
          );

        return await Promise.all(
          areas
            .filter((a) => a.plant.name === plant.name)
            .map(async (area) => {
              const newArea = await Area({
                name: area.name,
                code: area.code,
                plant: plant._id,
              });
              const stored = await newArea.save();
              return stored;
            })
        );
      })
    );
    res.status(200).send({ success: newAreas.flat(1), item: "area" });
  } catch (e) {
    console.log(e.message);
    res.status(400).send({ error: e.message, item: "area" });
  }
}

async function getAreas(req, res) {
  try {
    const areas = await Area.find({}).lean().exec();
    res.status(200).send(areas);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function deleteArea(areaId) {
  const area = await Area.findById(areaId);
  const { code } = area;
  const plant = await Plant.findOne({ _id: area.plant });
  await plant.areas.pull(area._id);
  await plant.save();
  await Area.deleteOne({ _id: area._id });
  return { success: true, code };
}

async function deleteOneArea(req, res) {
  try {
    const { areaId } = req.query;
    const area = await Area.findById(areaId);
    if (!area) throw new Error("El area a eliminar no existe");
    const lines = await Line.find({ area: area._id });
    if (lines.length > 0) throw new Error("El area a eliminar no existe");
    const { code, name } = area;
    await Plant.updateOne({ areas: area._id }, { $pull: { areas: area._id } });
    await Area.deleteOne({ _id: area._id });
    res.status(200).send({
      success: `El área ${name} fue eliminada`,
      item: "area",
      code,
    });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function getAreaByName(req, res) {
  try {
    let { name } = req.params;
    let area = await Area.findOne({ name: name });
    let result = { name: area.name, code: area.code };
    res.status(200).send(result);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function updateArea(req, res) {
  try {
    const { name, code } = req.body.area;
    const { previous } = req.body;
    const item = await Area.findOne({
      name: previous.name,
      code: previous.code,
    });
    if (!item) throw new Error("El elemento a editar no existe");
    const check = await Area.find({ $or: [{ name: name }, { code: code }] });
    if (code !== item.code && check.find((p) => p.code === code)) {
      throw new Error("Código actualmente en uso");
    }
    if (name !== item.name && check.find((p) => p.name === name))
      throw new Error("Nombre actualmente en uso");
    await Area.updateOne(
      { code: previous.code, name: previous.name },
      { name: name.toUpperCase(), code: code.toUpperCase() }
    );
    const update = await Area.findOne({ code: code, name: name });
    res.status(200).send({ success: update, item: "area", previous });
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
}

async function checkArea(areaName) {
  return await Area.findOne({ name: areaName }).lean().exec();
}

async function deletePlantAreas(req, res) {
  var results = [];
  const allAreas = await Area.find({}).lean().exec();
  const areas = allAreas.map((e) => e.name);
  req = { areas: areas };
  try {
    for await (area of areas) {
      results.push(await deleteArea(area));
    }
    res
      .status(200)
      .send({ borrados: results.length, detalle: results.map((e = e.name)) });
  } catch (e) {
    res.status(400).send([
      {
        borrados: results.filter((e) => e.success == true).length,
        nombres: results.filter((e) => e.success == true).map((e) => e.name),
      },
      {
        fallaron: results.filter((e) => e.success == false).length,
        nombres: results
          .filter((e) => e.success == false)
          .map((e) => [{ name: e.name, error: e.error }]),
      },
    ]);
  }
}

module.exports = {
  addAreaFromApp,
  getAreas,
  checkArea,
  addArea,
  deleteArea,
  deletePlantAreas,
  deleteOneArea,
  getAreaByName,
  updateArea,

  getAreaByNameAndParents,
};
