const Area = require("../models/Area");
const Plant = require("../models/Plant");

async function addNew(name, code) {
  const checkPlant = await Plant.find({ $or: [{ name }, { code }] })
    .lean()
    .exec();
  if (checkPlant.length) {
    throw new Error("La planta ya existe");
  } else {
    const item = await Plant({ name, code });
    const stored = await item.save();
    return stored;
  }
}

async function getByName(name) {
  return await Plant.findOne({ name: name });
}
async function getPlant(args = {}) {
  const { code, name } = args;
  if (code || name) {
    return await Plant.findOne(code ? { code } : name);
  } else {
    return await Plant.find(code ? { code } : name ? { name } : {});
  }
}
//*************** FOR ENDPOINTS ***************/
async function getPlants(req, res) {
  try {
    const { code, name } = req.query;
    let result;
    if (code || name) {
      result = await getPlant(code ? { code } : { name });
    } else {
      result = await getPlant({});
    }
    res.status(200).send(result);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function addPlant(req, res) {
  const { plants } = req.body;
  try {
    const newPlants = await Promise.all(
      plants.map(async (p) =>
        addNew(p.name.toUpperCase(), p.code.toUpperCase())
      )
    );
    res.status(200).send({ success: newPlants, item: "plant" });
  } catch (e) {
    res.status(400).send({ error: e.message, item: plants });
  }
}

async function getPlantByName(req, res) {
  try {
    const plant = await getByName({ name: req.params.name });
    const { name, code } = plant;
    res.status(200).send({ name, code });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function getPlantByCode(plantCode) {
  return await Plant.findOne({ code: plantCode });
}

async function getPlantNames(req, res) {
  try {
    const plants = (await Plant.find({}).lean().exec()).map((plant) => {
      const { name, code } = plant;
      return { name, code };
    });
    res.status(200).send(plants);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function locationOptions(req, res) {
  try {
    const { plantName } = req.params;
    const locationTree = {};
    const plant = await Plant.findOne({ name: plantName });
    for (let areaId of plant.areas) {
      const area = await Area.findOne({ _id: areaId }).populate("lines");
      locationTree[area.name] = area.lines.map((line) => line.name);
    }
    res.status(200).send({ plant: plantName, tree: locationTree });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function deletePlant(req, res) {
  try {
    const { code } = req.query;
    const plant = await Plant.findOne({ code }).lean().exec();
    if (!plant) throw new Error("La planta no existe");
    const areas = await Area.find({ plant: plant._id });
    if (areas.length > 0)
      throw new Error("La planta contiene áreas. Elimine las áreas primero");
    await Plant.deleteOne({ code });
    res.status(200).send({
      success: `La planta ${plant.name} fue eliminada`,
      item: "plant",
      code,
    });
  } catch (e) {
    res.status(400).send({ error: e.message, item: "plant" });
  }
}

async function updatePlant(req, res) {
  try {
    const { name, code } = req.body.plant;
    const { previous } = req.body;
    const plant = await Plant.findOne({
      name: previous.name,
      code: previous.code,
    });
    if (!plant) throw new Error("La planta a editar no existe");
    const check = await Plant.find({ $or: [{ name: name }, { code: code }] });
    if (code !== plant.code && check.find((p) => p.code === code)) {
      throw new Error("Código de Planta en uso");
    }
    if (name !== plant.name && check.find((p) => p.name === name))
      throw new Error("Nombre de Planta en uso");

    await Plant.updateOne(
      { code: previous.code, name: previous.name },
      { name: name.toUpperCase(), code: code.toUpperCase() }
    );
    const update = await Plant.findOne({ code: code, name: name });
    res.status(200).send({ success: update, item: "plant", previous });
  } catch (e) {
    console.log(e.message);
    res.status(400).send({ error: e.message });
  }
}

module.exports = {
  addNew,
  getByName,

  getPlants,

  addPlant,
  getPlantNames,
  getPlantByCode,
  getPlantByName,
  locationOptions,
  deletePlant,
  updatePlant,
};
