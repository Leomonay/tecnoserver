const WorkOrder = require ('../models/WorkOrder')
const Device = require ('../models/Device')
const WOoptions = require('../models/WOoptions')
const Line = require ('../models/Line')
const Area = require ('../models/Area')
const User = require ('../models/User')
const Plant = require ('../models/Plant')
const ServicePoint = require ('../models/ServicePoint')
const Cylinder = require('../models/Cylinder')
const CylinderUse = require('../models/CylinderUse')
const {createIntervention} = require ('../controllers/IntervController')
const { isoDate } = require('../utils/utils')

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
            area: (await Area.findOne({lines:line._id}).lean().exec()).name, 
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
            const newIntervention = await createIntervention(
                newOrder.code, intervention.workers, intervention.task, new Date (`${intervention.date} ${intervention.time}`),
            )
            await newIntervention.save()
            newOrder.interventions.push(newIntervention)
            await newOrder.save()
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
                        intervention: newIntervention._id,
                        consumption: cylinder.total,
                    })
                    await usage.save()
                })
            }
        })
    }
    res.status(200).send({orderId: newOrder.code})
}

async function getWObyId (req,res){
    const {idNumber} = req.params
    try{
        const workOrder = await WorkOrder.findOne({code: idNumber})
            .populate({path:'device', populate: 'refrigerant'})
            .populate({path: 'registration', populate: 'user'})
            .populate({path: 'supervisor', select: 'name'})
            .populate({path: 'interventions', populate: ['workers', 'gasUsage']})
            .populate('servicePoint')

        const device = workOrder.device
        let power = 0, unit=''

        if(device.power.magnitude<=9000){
            power = device.power.magnitude
            unit = 'Frigorías'
        }else{
            power = parseInt(device.power.magintude/3000)
            unit = 'Tn Refrigeración'
        }

        const itemToSend ={
            code: workOrder.code,
            class: workOrder.class,
            creationData:{
                date: isoDate(workOrder.registration.date),
                user: {
                    name: workOrder.registration.user.name,
                    idNumber: workOrder.registration.user.idNumber},
                solicitor: workOrder.solicitor,
                servicePoint: workOrder.servicePoint && {code: workOrder.servicePoint.code, name: workOrder.servicePoint.name} 
                },
            statusData: {
                status: workOrder.status,
                closed: workOrder.closed && workOrder.closed.date && isoDate(workOrder.closed.date),
                cause: workOrder.cause,
                issue: workOrder.initIssue,
            },
            description: workOrder.description,
            device:[
                {item: device.code, value: workOrder.device.name},
                {item: device.type, value: `${power} ${unit}`},
                {item: device.service, value: device.category},
                {item: 'status', value: device.status},
                {item: 'environment', value: device.environment},
            ]
        }
        const interventions = workOrder.interventions
        if (interventions.length>0){
            const interventionsArray =[]
            interventions.map(intervention=>{
                const item={
                    date: isoDate(intervention.date),
                    workers: intervention.workers.map(e=>{return{name: e.name, idNumber: e.idNumber}}),
                    tasks: intervention.tasks,
                }
                if (intervention.gasUsage.length>0){
                    item.gasUsage=[]
                    let total = 0
                    intervention.gasUsage.map(element=>{
                        total+=element.consumption
                        item.gasUsage.push({
                            cylinder: element._doc.code, 
                            consumption: element.consumption
                        })
                    })
                    item.gasUsage.unshift({total: total})
                }
                interventionsArray.push(item)
            })
            itemToSend.interventions=interventionsArray
        }
        console.log('itemToSend',itemToSend.interventions[0].gasUsage)
        res.status(200).send(itemToSend) 
    }catch(e){
        console.log(e.message)
        res.status(400).send({error: e.message})
    }
}

async function getWOList(req, res){

    const {from, to, plantName, solicitor} = req.body
    const plant = plantName? await Plant.findOne({name:plantName}):''
    const area = req.body.area? await Area.findOne({name:req.body.area}):''
    const line = req.body.line? await Line.findOne({name:req.body.line}):''
    const servicePoint = req.body.servicePoint? await ServicePoint.findOne({name:req.body.servicePoint}):''
    const device = req.body.device? await Device.findOne({code:req.body.device}):''
    const supervisor = req.body.supervisor? await User.findOne({idNumber:Number(req.body.supervisor)}):''

    let filter={'registration.date': {
        $gte: from,
        $lte: to,
        }}
    if(device){
        filter.device=device._id
    }else if(servicePoint){
        filter.servicePoint = servicePoint._id
    }else if(line){
        filter.device=await Device.find({line:line._id})
    }else if(area){
        filter.device=await Device.find({line: area.lines})
    }else if(plant){
        const areas = await Area.find({_id: plant.areas})
        let lines = []
        areas.map(area=>lines=[...lines, ...area.lines])
        filter.device = (await Device.find({line: lines})).map(line=>line._id)
    }

    if (solicitor) filter['solicitor.name'] = {$regex: new RegExp("^" + solicitor.toLowerCase(), "i")}
    if (supervisor) filter.supervisor = supervisor._id

    const workOrders = await WorkOrder.find(filter)
        .populate({path: 'device', populate:'line'})
        .populate({path: 'registration', populate: 'user'})
        .populate({path: 'supervisor', select: 'name'})
        .populate({path: 'interventions', populate: ['workers', 'gasUsage']})
        .populate('servicePoint')
        .sort('code')
        .limit(10)
    
    const array = workOrders.map(order=>{
        return{
            code: order.code,
            class: order.class,
            device: {
                code: order.device.code,
                name: order.device.name,
                line: order.device.line.name,
            },
            solicitor: order.solicitor.name,
            date: order.registration.date,
            supervisor: order.supervisor.name,
            close: order.closed.date || '',
            description: order.description
        }
    })

    res.status(200).send(array)
}

module.exports = {getMostRecent, getOptions, addOrder, getWObyId, getWOList}