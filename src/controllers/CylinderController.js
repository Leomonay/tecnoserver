const Cylinder = require("../models/Cylinder");
const CylinderUse = require("../models/CylinderUse");
const Refrigerante = require("../models/Refrigerante");
const Intervention = require("../models/Intervention");
const WorkOrder = require("../models/WorkOrder");

const mongoose = require("mongoose");

async function getCylinders(req, res) {
  const cilinders = await Cylinder.find().lean().exec();
  const uses = await CylinderUse.aggregate([
    {
      $group: {
        _id: "$cylinder",
        sum: { $sum: "$consumption" },
      },
    },
  ]);

  const cilindersComplete = cilinders.map((element) => {
    let usadoElemento = uses.find(
      (el) => JSON.stringify(el._id) === JSON.stringify(element._id)
    );
    return usadoElemento
      ? { ...element, actualStock: element.initialStock - usadoElemento.sum }
      : { ...element, actualStock: element.initialStock };
  });
  res.status(200).send(cilindersComplete);
}

async function getRefrigerant(req, res) {
  const refrigerantes = await Refrigerante.find().lean().exec();
  res.status(200).send(refrigerantes);
}

async function addUsage(code, consumption, interventionId) {
  const intervention = await Intervention.findOne({ _id: interventionId });
  if (!intervention)
    throw new Error("La intervención no existe en base de datos");
  const cylinder = await Cylinder.findOne({ code: code });
  if (!cylinder) throw new Error("La garrafa no existe en base de datos");

  const newUsage = await CylinderUse({
    code: cylinder._id,
    intervention: interventionId,
    consumption: consumption,
  });

  await newUsage.save();
  intervention.gasUsage = intervention.gasUsage
    ? [...intervention.gasUsage, newUsage]
    : [newUsage];
  await intervention.save();
  return intervention;
}
async function postUsage(req, res) {
  const { code, consumption, wOCode, date } = req.body;
  try {
    const workOrder = await WorkOrder.findOne({ code: wOCode });
    if (!workOrder) throw new Error("Orden de Trabajo no encontrada");
    const interventions = await Intervention.find({ workOrder: workOrder._id });
    const intervention = interventions.find(
      (intervention) => intervention.date.toISOString().split("T")[0] === date
    );
    if (!intervention)
      throw new Error("No hay intervenciones ese día en esa OT");
    await addUsage(code, consumption, intervention._id);
    res.status(200).send("Consumo registrado con éxito");
  } catch (e) {
    console.error(e.message);
    res.status(400).send({ error: e.message });
  }
}

async function createCylinder(req, res) {
  const { code, refrigerant, initialStock, assignedTo, status } = req.body;
  try {
    const cylinder = await Cylinder({
      code,
      refrigerant: mongoose.Types.ObjectId(refrigerant),
      initialStock,
      assignedTo: assignedTo ? mongoose.Types.ObjectId(assignedTo) : "",
      status,
    });
    cylinder.save();
    res.json("Garrafa creada con éxito!");
  } catch (e) {
    console.error(e.message);
    res.status(400).send({ error: e.message });
  }
}

async function updateCylinder(req, res) {
  try {
    const { newAssignedTo, newStatus, id } = req.body;
    const checkCylinder = await Cylinder.find({
      _id: mongoose.Types.ObjectId(id),
    })
      .lean()
      .exec();
    if (checkCylinder.length > 0) {
      const cylinderUpdated = await Cylinder.updateOne(
        { _id: mongoose.Types.ObjectId(id) },
        {
          assignedTo: mongoose.Types.ObjectId(newAssignedTo),
          status: newStatus,
        }
      );
      res.status(201).send({ cylinderUpdated });
    } else {
      res.status(400).send({ message: "La garrafa no existe" });
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
}

async function deleteCylinder(req, res) {
  try {
    const { id } = req.body;
    const checkCylinder = await Cylinder.find({
      _id: mongoose.Types.ObjectId(id),
    })
      .lean()
      .exec();
    if (checkCylinder.length > 0) {
      let cylinderID = checkCylinder[0]._id;
      const cylinderDeleted = await Cylinder.deleteOne({ _id: cylinderID });
      res.status(201).send({ cylinderDeleted });
    } else {
      res.status(400).send({ message: "La garrafa no existe" });
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
}

//Funcion para probar el uso de las garrafas con el postman
async function addUsageCylinder(req, res) {
  const { cylinder_id, interventionId, consumption } = req.body;

  const newUsage = await CylinderUse({
    cylinder: mongoose.Types.ObjectId(cylinder_id),
    intervention: mongoose.Types.ObjectId(interventionId),
    consumption: consumption,
  });
  await newUsage.save();
  res.status(200).send("newUsage");
}

module.exports = {
  getCylinders,
  getRefrigerant,
  createCylinder,
  postUsage,
  addUsage,
  updateCylinder,
  addUsageCylinder,
  deleteCylinder,
};
