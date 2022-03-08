const Cylinder = require("../models/Cylinder");
const CylinderUse = require("../models/CylinderUse");
const Refrigerante = require("../models/Refrigerant");
const Intervention = require("../models/Intervention");
const WorkOrder = require("../models/WorkOrder");
const User = require("../models/User");

async function getCylinders(req, res) {
  try{
    let ids = req.query.ids
    let users = []
    let cylinders = []
    if(ids){
      ids=JSON.parse(ids)
      users = await User.find({idNumber: ids}).lean().exec()
      cylinders = await Cylinder.find({assignedTo:users.map(user=>user._id)}).populate('assignedTo')
    }else{
      users = await User.find({}).lean().exec()
      cylinders = await Cylinder.find({}).populate(['assignedTo','refrigerant']) 
    }

    const gasUsages  = await CylinderUse.find({cylinder: cylinders.map(e=>e._id)})
      .populate({path: 'cylinder', populate:[{path:'assignedTo'},{path:'refrigerant'}]})
    
    const toSend=[]
    for (let cylinder of cylinders){
      toSend.push(
        await buildCylinder(
          cylinder,
          gasUsages.filter(e=>e.cylinder.code === cylinder.code)
        )
      )
    }
    res.status(200).send(toSend)
  }catch(e){
    res.status(400).send({error: e.message})
  }
}

async function buildCylinder (cylinder, gasUsages){
  const {id, code,status, initialStock} = cylinder
  if (!gasUsages) gasUsages = await CylinderUse.find({cylinder: cylinder._id})
  const consumptions = gasUsages.map(e=>e.consumption)
  const currentStock = initialStock - consumptions.reduce((a,b)=>a+b,0)
  const newCylinder = {id, code, status, initialStock, currentStock}

  newCylinder.refrigerant = 
    cylinder.refrigerant.refrigerante
    || ( await Refrigerante.findOne({_id: cylinder.refrigerant}) ).refrigerante 

  let user = cylinder.assignedTo
  if(user) user = user.idNumber || (await User.findOne({_id: user})).idNumber
  if (user) newCylinder.user = user

  return newCylinder
}

async function getRefrigerant(req, res) {
  try{
    const refrigerantes = await Refrigerante.find().lean().exec();
    res.status(200).send(refrigerantes);
  }catch(e){
    res.status(400).send({error: e.message})
  }
}

async function addUsage(code, consumption, interventionId) {
  try{
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
  }catch(e){
    return({error: e.message})
  }
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



async function createCylinder(req, res){
  console.log(req.body)
  try {
    const { code, refrigerant, initialStock, assignedTo, status } = req.body;

    const user = await User.findOne({idNumber: assignedTo})
    const gas = await Refrigerante.findById(refrigerant)

    const cylinder = await Cylinder({
      code,
      refrigerant: gas._id,
      initialStock,
      givenDate: new Date(),
      assignedTo: user ? user._id : undefined,
      status
    });
    const newCylinder = await cylinder.save()
    res.status(200).json(await buildCylinder( newCylinder ));
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function updateCylinder(req, res){
  try{
    console.log('req.body', req.body)
    const {id, assignedTo, status, code} = req.body
    const cylinder = await Cylinder.findById(id)
    if (!cylinder) throw new Error (`La garrafa ${code} no existe`)
    const update = {code, status}
    const user = await User.findOne({idNumber: assignedTo})
    user ? (update.assignedTo = user._id) : (update['$unset']={assignedTo:1})
    await Cylinder.findByIdAndUpdate(cylinder._id, update)
    const stored = await Cylinder.findById(id)
    console.log('stored', stored)
    res.status(200).send( await buildCylinder(stored) )
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

async function deleteCylinder(req, res){
  try{
    const {id} = req.query
    console.log('id', id)
    const cylinder = await Cylinder.findById(id)
    const {code} = cylinder
    if (!cylinder) throw new Error (`La garrafa ${code} no existe`)
    if (cylinder.usages && cylinder.usages[0]) throw new Error (`La garrafa ${code} no se puede eliminar porque tiene consumos`)
    await Cylinder.findByIdAndDelete(cylinder._id)
    res.status(200).send({id, message:`Garrafa ${code} eliminada exitosamente`} )
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
}

// async function deleteCylinderUsage(req, res){
//   const {code, order, date, consumption} = req.body
//   const workOrder = await WorkOrder.findOne({code: order})
//   const intervention = ( await Intervention.findOne({workOrder: workOrder._id, date}) )._id
//   const cylinder = await Cylinder.findOneAndUpdate({code},{
//     $pull:{usages: {intervention, consumption} }
//   }) 
//   res.status(200).send(cylinder);
// }

async function addUsageCylinder(req, res) {
  const {intervention, user, gases}=req.body
  try{
    const interventionUse = await Intervention.findOne({_id: intervention})
    const userReg = await User.findOne({idNumber:user})

    const usages = []
    for await (let usage of gases){
      const newUsage = await CylinderUse({
        cylinder: ( await Cylinder.findOne({code: usage.code}) )._id,
        intervention: interventionUse._id,
        user: userReg._id,
        consumption: usage.total
      })
      usages.push(await newUsage.save())
    }
    const itemsToSend = await CylinderUse.find({_id:usages.map(usage=>usage._id)}).populate({path: 'cylinder', populate: 'assignedTo'})

    res.status(200).send({intervention, refrigerant: buildGasUsages(itemsToSend)})
  }catch(e){
    res.status(400).send({error: e.message})
  }
}

function buildGasUsages(usages){
  const usageArray = []
  let total = 0 
  for (let usage of usages){
      total += usage.consumption
      usageArray.push({
          id: usage._id,
          code: usage.cylinder.code,
          total: usage.consumption,
          owner: usage.cylinder.assignedTo.name
      })
  }
  usageArray.unshift({total})
  return usageArray
}

async function deleteCylinderUsage(req, res){
  const {intervention, user, usages} = req.body
  try{
    const interventionUse = await Intervention.findOne({_id: intervention})
    const userUse = await User.findOne({idNumber:user})
    const cylinderUses = await CylinderUse.find({_id: usages.map(use=>use.id)}).populate('cylinder')
    if (!cylinderUses[0]) throw new Error ('Consumos no encontrados en base de datos')
    let codes = []
    let ids = []
    for await (let use of cylinderUses ){
      codes.push({code: use.cylinder.code, kg: use.consumption})
      ids.push(use._id)
      await CylinderUse.findByIdAndDelete(use._id)
    }
    console.log('codes',codes)
    const date = new Date()
    const time = date.toLocaleDateString()+' '+date.getHours()+':'+date.getMinutes()
    const task = interventionUse.tasks+` || ${userUse.username} ${time} borró consumos ${
      codes.map( item =>`(${item.kg} kg. garrafa ${item.code})` ) }`
    await Intervention.findByIdAndUpdate(interventionUse._id, {
      tasks: task})

    res.status(200).send({
      intervention,
      task,
      success:`Consumo de garrafa ${JSON.stringify(codes)} borrado exitosamente.`,
      ids
    })
  }catch(e){
    res.status(400).send({error: e.message})
  }
}

async function getCylindersByCode(req, res){
  try{
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
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
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
  deleteCylinderUsage,
};
