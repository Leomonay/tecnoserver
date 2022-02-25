const Cylinder = require("../models/Cylinder");
const CylinderUse = require("../models/CylinderUse");
const Refrigerante = require("../models/Refrigerant");
const Intervention = require("../models/Intervention");
const WorkOrder = require("../models/WorkOrder");

const mongoose = require("mongoose");
const User = require("../models/User");
const Refrigerant = require("../models/Refrigerant");

async function getCylinders(req, res) {
  const ids = JSON.parse(req.query.ids)
  const users = await User.find(ids[0] ? {idNumber: ids} : {}).lean().exec()
  const cylinders = await Cylinder.find(ids[0] ? {assignedTo:users.map(user=>user._id)} :{})
    .populate('assignedTo') 
  const gasUsages  = await CylinderUse.find({cylinder: cylinders.map(e=>e._id)})
    .populate({path: 'cylinder', populate:{path:'assignedTo'}})
  

  const toSend = cylinders.map(cylinder=>{
    const usages = gasUsages.filter(e=>e.cylinder.code === cylinder.code)
    const consumptions = usages.map(e=>e.consumption)
    const totalConsumption = consumptions.reduce((a,b)=>a+b,0)
    return{
      code: cylinder.code,
      user: cylinder.assignedTo && cylinder.assignedTo.idNumber,
      currentStock: cylinder.initialStock - totalConsumption
    }
  })
  res.status(200).send(toSend)
}

  async function getCylinders8(req, res) {
  // const cilindersComplete= await User.aggregate(
  //   [
  //     //definimos el elemento de la primera colección:
  //     { $match: ids? {idNumber: ids.map(id=>Number(id))} : {} },
  //     { $lookup:{
  //         from: 'cylinders',
  //         localField: '_id',
  //         foreignField: 'assignedTo',
  //         as: 'cylinders'
  //     }},
  //     {$unwind: '$cylinders'},
  //     {$group:{
  //       _id: '$cylinders',
  //       sum: { $sum: "$consumption" },
  //     }}

  //   ]
  // )
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

  const { code, refrigerante, initialStock, assignedTo } = req.body;

  const user = await User.findOne({idNumber: assignedTo})
  const refrigerant = await Refrigerant.findOne({refrigerante: refrigerante})

  try {
    const cylinder = await Cylinder({
      code,
      refrigerant,
      initialStock,
      givenDate: new Date(),
      assignedTo: user ? user._id : undefined,
      status: 'Nueva',
    });    
    res.status(200).json(await cylinder.save());
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function updateCylinder(req, res){
  const {assignedTo, status, code, oldCode} = req.body
  const cylinder = await Cylinder.findOne({code: oldCode})
  if (!cylinder) throw new Error (`La garrafa ${code} no existe`)
  const update = {code, status}
  const user = await User.findOne({idNumber: assignedTo})
  if (user) update.assignedTo = user._id
  res.status(200).send( await Cylinder.findByIdAndUpdate ( cylinder._id, update) )
}

async function deleteCylinder(req, res){
  const {code} = req.query
  const cylinder = await Cylinder.findOne({code: oldCode})
  if (!cylinder) throw new Error (`La garrafa ${code} no existe`)
  if (cylinder.usages[0]) throw new Error (`La garrafa ${code} no se puede eliminar porque tiene consumos`)
  await Cylinder.findByIdAndDelete(cylinder._id)
  res.status(200).send( `Garrafa ${code} eliminada exitosamente` )
}

async function deleteCylinderUsage(req, res){
  const {code, order, date, consumption} = req.body
  const workOrder = await WorkOrder.findOne({code: order})
  const intervention = ( await Intervention.findOne({workOrder: workOrder._id, date}) )._id
  const cylinder = await Cylinder.findOneAndUpdate({code},{
    $pull:{usages: {intervention, consumption} }
  }) 
  res.status(200).send(cylinder);
}

async function addUsageCylinder(req, res) {
  try{
    const {code, order, date, consumption, user} = req.body
    const workOrder = await WorkOrder.findOne({code: order})
    const intervention = ( await Intervention.findOne({workOrder: workOrder._id, date}) )._id
    const cylinder = ( await Cylinder.findOne({code}) )._id
    res.status(200).send(
      await CylinderUse({
        cylinder: cylinder._id,
        intervention,
        user: user._id,
        consumption
      }))
  }catch(e){
    res.status(400).send({error: e.message})
  }
}

async function deleteCylinderUsage(req, res){
  try{
    const {code, order, date, consumption} = req.body
    const workOrder = await WorkOrder.findOne({code: order})
    const intervention = ( await Intervention.findOne({workOrder: workOrder._id, date}) )._id
    const cylinder = ( await Cylinder.findOne({code}) )._id
    const usage = await CylinderUse.findOne({intervention, cylinder, consumption})
    if (!usage) throw new Error (`No hay un consumo de ${consumption}kg de la garrafa ${code} para la orden ${order} en la fecha ${date}`)
    await CylinderUse.findByIdAndDelete(usage._id)
    res.status(200).send(`Consumo de ${consumption}kg garrafa ${code} borrado exitosamente.`)
  }catch(e){
    res.status(400).send({error: e.message})
  }
}

async function getCylindersByCode(req, res){
  const {codes} = req.query
  const cylinders = await Cylinders.find({code: codes})
    .populate([
      {path: 'assignedTo', select:['idNumber', 'name']},
      {path: 'refrigerant', select:'refrigerante'}])

  cylinders.map(cylinder=>{
    const {code, refrigerant, initialStock, givenDate, status, usages} = cylinder
    const user = cylinder.assignedTo
    const gas =  refrigerant.refrigerante
    const assignedTo = user? {id: user.idNumber, name: user.name} : undefined
    const consumption = usages[0] ? usages.map(e=>e.consumption).reduce( (a,b) => a+b) : 0
    const stock = initialStock-consumption
    return {code, gas, status, givenDate, assignedTo, initialStock, stock}
  })
}



// async function updateCylinder(req, res) {
//   try {
//     const { newAssignedTo, newStatus, id } = req.body;
//     const checkCylinder = await Cylinder.find({
//       _id: mongoose.Types.ObjectId(id),
//     })
//       .lean()
//       .exec();
//     if (checkCylinder.length > 0) {
//       const cylinderUpdated = await Cylinder.updateOne(
//         { _id: mongoose.Types.ObjectId(id) },
//         {
//           assignedTo: mongoose.Types.ObjectId(newAssignedTo),
//           status: newStatus,
//         }
//       );
//       res.status(201).send({ cylinderUpdated });
//     } else {
//       res.status(400).send({ message: "La garrafa no existe" });
//     }
//   } catch (e) {
//     res.status(500).send({ message: e.message });
//   }
// }

// async function deleteCylinder(req, res) {
//   try {
//     const { id } = req.body;
//     const checkCylinder = await Cylinder.find({
//       _id: mongoose.Types.ObjectId(id),
//     })
//       .lean()
//       .exec();
//     if (checkCylinder.length > 0) {
//       let cylinderID = checkCylinder[0]._id;
//       const cylinderDeleted = await Cylinder.deleteOne({ _id: cylinderID });
//       res.status(201).send({ cylinderDeleted });
//     } else {
//       res.status(400).send({ message: "La garrafa no existe" });
//     }
//   } catch (e) {
//     res.status(500).send({ message: e.message });
//   }
// }



// //Funcion para probar el uso de las garrafas con el postman
// async function addUsageCylinder(req, res) {
//   const {code, order, date, consumption} = req.body
//   const workOrder = await WorkOrder.findOne({code: order})
//   const intervention = ( await Intervention.findOne({workOrder: workOrder._id, date}) )._id
//   const cylinder = await Cylinder.findOneAndUpdate({code},{
//     $push:{usages: {intervention, consumption} }
//   }) 

//   // const { cylinder_id, interventionId, consumption } = req.body;

//   // const newUsage = await CylinderUse({
//   //   cylinder: mongoose.Types.ObjectId(cylinder_id),
//   //   intervention: mongoose.Types.ObjectId(interventionId),
//   //   consumption: consumption,
//   // });
//   // await newUsage.save();
//   res.status(200).send(cylinder);
// }

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
