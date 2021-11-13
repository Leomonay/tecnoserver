const WorkOrder = require ('../models/WorkOrder')
const Device = require ('../models/Device')
const WOoptions = require('../models/WOoptions')
const Line = require ('../models/Line')
const Area = require ('../models/Area')
const User = require ('../models/User')
const Intervention = require ('../models/Intervention')
const Cylinder = require('../models/Cylinder')
const CylinderUse = require('../models/CylinderUse')

async function getMostRecent(req, res){
    const {limit, conditions} = req.body
    const causes = (await WOoptions.findOne({ name: "Work Orders Options" })).causes

    let otList = await WorkOrder.find(conditions).sort({'registration.date':-1}).limit(limit||10).lean().populate({path:'device', model:Device}).exec()
    
    let otArray=[]
    for await (let ot of otList){
        const line = await Line.findOne({_id:ot.device.line}).lean().exec()
        const element={
            code: ot.code,
            status: ot.status,
            device: ot.device.name,
            line: line.name,
            area: (await Area.findOne({line:line._id}).lean().exec()).name, 
            description: ot.description,
            initIssue: ot.initIssue,
            solicitor: ot.solicitor,
            registration: ot.registration.date,
            clientWO: ot.clientWO,
            closed: ot.closed?ot.closed.date:'',
            cause: ot.cause||'',
            macroCause: ot.cause?causes.find(e=>e.name===ot.cause).macro:''
        }
            otArray.push(element)
        }
    res.status(200).send(otArray)
}

async function getOptions(req, res){
    const options = await WOoptions.findOne({})
    res.status(200).send({
            supervisor: (await User.find({access: 'Supervisor'}).sort('name')).map(user=>{return {
                name: user.name,
                id: user.idNumber
            }}),
            status: options.status,
            class: options.classes,
            issue: options.issueType,
            cause: options.causes.map(e=>e.name)
        })
}

async function addOrder(req,res){
    const workOrder = req.body
    const newOrder = await WorkOrder({
        code: ( await WorkOrder.findOne({},{},{sort:{code:-1}}) ).code +1, 
        device: await Device.findOne({code:workOrder.device}),
        status: "Abierta",
        class: workOrder.class,
        initIssue: workOrder.issue,
        solicitor: {name: workOrder.solicitor, phone: workOrder.phone},      
        registration: {date: new Date(), user: await User.findOne({idNumber:workOrder.supervisor.id})},
        clientWO: workOrder.clientWO,
        supervisor: await User.findOne({idNumber:workOrder.supervisor.id}),
        description: workOrder.description,
        cause: workOrder.cause,
    })
    await newOrder.save()
    if(workOrder.interventions){
        workOrder.interventions.map(async(intervention)=>{
            const interv = await Intervention({
                workOrder: newOrder._id,
                workers: await User.find({idNumber : intervention.workers.map(e=>e.id)}),
                tasks: intervention.task,
                date: new Date (`${intervention.date} ${intervention.time}`),
            })
            await interv.save()
            if (intervention.refrigerant){
                intervention.refrigerant.map(async(cylinder)=>{
                    let item = await Cylinder.findOne({code: cylinder.cylinder})
                    console.log('cylinderCode', item)
                    if (!item) {
                        const cylinderDevice = await Device.findOne({code: workOrder.device}).populate('refrigerant')
                        item = await Cylinder({
                            code: cylinder.cylinder,
                            refrigerant: cylinderDevice.refrigerant._id,
                            initialStock: cylinder.init,
                        })
                        await item.save()
                    }
                    const usage = await CylinderUse({
                        code: cylinder.cylinder,
                        intervention: interv._id,
                        consumption: cylinder.total,
                    })
                    await usage.save()
                })
            }
        })
    }
    res.status(200).send({orderId: newOrder.code})
}

module.exports = {getMostRecent, getOptions, addOrder}