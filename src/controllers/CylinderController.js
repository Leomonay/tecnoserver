const Cylinder = require('../models/Cylinder')
const CylinderUse = require ('../models/CylinderUse')
const Intervention = require('../models/Intervention')
const WorkOrder = require('../models/WorkOrder')

async function addUsage(code, consumption, interventionId){
    const intervention = await Intervention.findOne({_id: interventionId})
    if (!intervention) throw new Error ('La intervención no existe en base de datos')
    const cylinder = await Cylinder.findOne({code:code})
    if (!cylinder) throw new Error ('La garrafa no existe en base de datos')

    const newUsage = await CylinderUse({
        code: cylinder._id,
        intervention: interventionId,
        consumption: consumption,
    })

    await newUsage.save()
    intervention.gasUsage = intervention.gasUsage ? [...intervention.gasUsage,newUsage] : [newUsage]
    await intervention.save()
    return intervention
}
async function postUsage(req,res){
    const {code, consumption, wOCode, date} = req.body
    try{
        const workOrder = await WorkOrder.findOne({code: wOCode})
        if (!workOrder) throw new Error ('Orden de Trabajo no encontrada')
        const interventions = await Intervention.find({workOrder: workOrder._id})
        const intervention = interventions.find(intervention => intervention.date.toISOString().split('T')[0] === date)
        if (!intervention) throw new Error ('No hay intervenciones ese día en esa OT')
        await addUsage(code, consumption, intervention._id)
        res.status(200).send('Consumo registrado con éxito')
    }catch(e){
        console.error(e.message)
        res.status(400).send({error: e.message})
    }
}

async function createCylinder(req,res){
    const {code, refrigerant, initialStock, assignedTo} = req.body
    try{
        const cylinder = await Cylinder({
            code, refrigerant,initialStock,assignedTo
        })
        cylinder.save()
        res.status(200).send('Garrafa creada con éxito!')    
    }catch(e){
        console.error(e.message)
        res.status(400).send({error: e.message})
    }
}

module.exports = {
    createCylinder,
    postUsage,
    addUsage
  };
  