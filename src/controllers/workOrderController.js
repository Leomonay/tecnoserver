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
const Intervention = require('../models/Intervention')
const TaskDates = require('../models/TaskDates')

const devController = require('./deviceController')
const woController = require('./workOrderController')
const { findOne } = require('../models/WOoptions')

function buildOrder(order){
    return {
        code: order.code,
        class: order.class,
        status: order.status,
        devCode: order.device.code,
        devName: order.device.name,
        line: order.device.line.name,
        area: order.device.line.area.name,
        plant: order.device.line.area.plant.name,
        solicitor: order.solicitor.name,
        date: order.registration.date,
        supervisor: order.supervisor && order.supervisor.name,
        close: order.closed.date || '',
        description: order.description,
        servicePoint: order.servicePoint && order.servicePoint.name
    }
}

async function getListData(input){
    return await (typeof input === 'object' ? WorkOrder.find(input) : WorkOrder.findOne({code: input}))
        .populate({path:'device',
            populate: ['refrigerant',
                {path: 'line', select: 'name', populate:{
                path: 'area', select: 'name', populate:{
                path: 'plant', select: 'name'}}}]
            })
        .populate({path: 'registration', populate: 'user'})
        .populate({path: 'supervisor', select: ['id', 'name']})
        .populate('servicePoint')
}


async function getByDevice (deviceCode, clase){
    const device = await devController.findById(deviceCode)
    const matches={device: device._id}
    if(clase) matches.class = clase
    return (await WorkOrder.find(matches))
}

async function getMostRecent(req, res){
    try{
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
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
}

async function getOptions(req, res){
    try{
        const options = await WOoptions.findOne({})
        res.status(200).send({
            supervisor: (await User.find({access: 'Supervisor', active:true}).sort('name')).map(user=>{return {
                name: user.name,
                id: user.idNumber
            }}),
            // status: options.status,
            class: options.classes,
            issue: options.issueType,
            cause: options.causes.map(e=>e.name)
        })
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
}

async function addOrder(req,res){
    try{
        const workOrder = req.body
        const sp = await ServicePoint.findOne({name:workOrder.servicePoint})
        const newOrder = await WorkOrder({
            code: ( await WorkOrder.findOne({},{},{sort:{code:-1}}) ).code +1, 
            device: ( await Device.findOne({code: workOrder.device}) )._id,
            status: "Abierta",
            class: workOrder.class,
            initIssue: workOrder.issue,
            solicitor: {name: workOrder.solicitor, phone: workOrder.phone},      
            registration: {date: new Date(),
                user: ( await User.findOne({
                    username: workOrder.user,
                }) )._id
            },
            clientWO: workOrder.clientWO,
            supervisor: ( await User.findOne({idNumber:workOrder.supervisor}) )._id,
            description: workOrder.description,
            servicePoint: sp? sp._id : undefined,
            cause: workOrder.cause,
            completed: workOrder.completed || 0
        })
        await newOrder.save()

        if(workOrder.interventions){
            newOrder.interventions=[]
            for await (let intervention of workOrder.interventions){
                const newItem = await Intervention({
                    workOrder: newOrder._id,
                    workers: await User.find({idNumber: intervention.workers.map(item=>item.id)}), 
                    tasks: intervention.task, 
                    date: new Date (`${intervention.date} ${intervention.time}`),
                })

                const newIntervention = await newItem.save()

                // creating gasUsages for interventions
                if (intervention.refrigerant){
                    const gasUsages =[]
                    for await (let cylinder of intervention.refrigerant){
                        let item = await Cylinder.findOne({code: cylinder.code})
                        let user = await User.findOne({idNumber: cylinder.user})

                        const usage = await CylinderUse({
                            cylinder: item._id,
                            intervention: newIntervention._id,
                            user,
                            consumption: cylinder.total,
                        })
                        gasUsages.push( await usage.save() )
                    }
                    newIntervention.gasUsages = gasUsages
                }
                newOrder.interventions.push( newIntervention )
            }
        }

        if (workOrder.taskDate) await TaskDates.findByIdAndUpdate(workOrder.taskDate,{$push: {workOrders: workOrder._id}})
        const order = await getListData(newOrder.code)
        res.status(200).send(buildOrder(order))
    } catch (e) {
        console.log(e)
        res.status(400).send({ error: e.message });
    }
}

async function getWObyId (req,res){
    const {idNumber} = req.params
    try{
        const workOrder = await WorkOrder.findOne({code: idNumber})
            .populate({path:'device',
                populate: ['refrigerant',
                    {path: 'line', select: 'name', populate:{
                    path: 'area', select: 'name', populate:{
                    path: 'plant', select: 'name'}}}]
                })
            .populate({path: 'registration', populate: 'user', select:['name', 'idNumber']})
            .populate({path: 'supervisor', select: 'idNumber'})
            .populate({path: 'interventions', populate: ['workers']})
            .populate('servicePoint')

        const interventions = await Intervention.find({workOrder: workOrder._id}).populate('workers')
        const gasUsage = await CylinderUse.find({intervention: interventions.map(e=>e._id)}).populate({path:'cylinder', populate:'assignedTo'})
        const taskDate = await TaskDates.findOne({workOrders: workOrder._id})

            const device = workOrder.device
            let power = 0, unit=''

            if(device.power.magnitude<=9000){
                power = device.power.magnitude
                unit = 'Frigorías'
            }else{
                power = parseInt(device.power.magintude/3000)
                unit = 'Tn Refrigeración'
            }

            const itemToSend = {
                code: workOrder.code,
                class: workOrder.class,
                regDate: workOrder.registration.date,
                user: workOrder.registration.user? workOrder.registration.user.name : 'Sin Dato',
                userId: workOrder.registration.user? workOrder.registration.user.idNumber : undefined,
                solicitor: workOrder.solicitor.name,
                phone: workOrder.solicitor.phone,                
                supervisor: workOrder.supervisor? workOrder.supervisor.idNumber : "[Sin Dato]",
                status: workOrder.status,
                closed: workOrder.closed && workOrder.closed.date,
                cause: workOrder.cause,
                issue: workOrder.initIssue,
                description: workOrder.description,
                completed: workOrder.completed,
                clientWO: workOrder.clientWO,
                servicePoint: workOrder.servicePoint? workOrder.servicePoint.name : undefined,
                device:{
                    plant: device.line.area.plant.name,
                    area: device.line.area.name,
                    line: device.line.name,
                    code: device.code,
                    name: device.name,
                    type: device.type,
                    power,
                    unit,
                    refrigerant: device.refrigerant.refrigerante,
                    status: device.status,
                    environment: device.environment,
                    category: device.category,
                    service: device.service
                }
            }
        
        // getting workOrder interventions
        const interventionsArray =[]
        for (let intervention of interventions){
            const item={
                id: intervention._id,
                date: intervention.date,
                workers: intervention.workers.map(e=>{return{name: e.name, id: e.idNumber}}),
                task: intervention.tasks,
            }
            
            // getting gas usages for interventions
            const gas = gasUsage.filter(usage=>JSON.stringify(usage.intervention) === JSON.stringify(intervention._id))
            item.refrigerant=[]
            let total = 0
            for (let element of gas){
                total += element.consumption
                item.refrigerant.push({
                    id: element._id,
                    code: element.cylinder.code,
                    total: element.consumption,
                    owner: element.cylinder.assignedTo.name
                })
            }
            item.refrigerant.unshift({total: total})
            interventionsArray.push(item)
        }
        itemToSend.interventions=interventionsArray

        if(taskDate){itemToSend.taskDate = taskDate._id}

        res.status(200).send(itemToSend)
         
    }catch(e){
        console.log(e)
        res.status(400).send({error: e.message})
    }
}

async function getWOList(req, res){
    try{
        const {plant, year, page} = req.query
        const filters = {}
        if(plant) filters.plant = ( await Plant.findOne({name:plant}) )._id
        if(year) filters['registration.date']={
            $gte: new Date(`${year}/01/01`),
            $lte: new Date(`${year}/12/31`),
            }

        const workOrders = await WorkOrder.find(filters)
            .populate({path: 'device', select:['code', 'name'], populate:{
                path: 'line', select:'name', populate:{
                    path:'area', select:'name',populate:{
                        path:'plant', select:'name'
                    }
                }}})
            .populate({path: 'registration', populate: 'user'})
            .populate({path: 'supervisor', select: ['id', 'name']})
            .populate('servicePoint')
            .sort('code')

        const array = workOrders.map(order=>{
            return{
                code: order.code,
                class: order.class,
                status: order.status,
                devCode: order.device.code,
                devName: order.device.name,
                line: order.device.line.name,
                area: order.device.line.area.name,
                plant: order.device.line.area.plant.name,
                solicitor: order.solicitor.name,
                date: order.registration.date,
                supervisor: order.supervisor && order.supervisor.name,
                close: order.closed.date || '',
                description: order.description,
                servicePoint: order.servicePoint && order.servicePoint.name
            }
        })
        res.status(200).send(array.sort((a,b)=>a.code<b.code?1:-1))
    } catch (e) {
        console.log(e)
        res.status(400).send({ error: e.message });
    }
}

async function deleteWorkOrder(req, res){
    try{
        const {code} =req.params
        const order = await WorkOrder.findOne({code:code})
        const interventions = await WorkOrder.find({_id: order.interventions})
        const gasUsages = await CylinderUse.find({interventions_id: interventions})

        await CylinderUse.deleteMany({_id: gasUsages.map(item=>item._id)})
        interventions && await Intervention.deleteMany({_id: interventions.map(item=>item._id)})
        await WorkOrder.deleteOne({_id: order._id})

        res.status(200).send({result: 'success'})
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function updateWorkOrder(req, res){
    try{
        const {code} = req.params
        const update = {}

        if(req.body.device) update.device = ( await Device.findOne({code: req.body.device}) )._id
        if(req.body.class) update.class = req.body.class
        if(req.body.issue) update.initIssue = req.body.issue
        if(req.body.cause) update.cause = req.body.cause
        if(req.body.solicitor) update.solicitor = {name: req.body.solicitor}
        if(req.body.phone) update.solicitor.phone = req.body.phone
        if(req.body.description) update.description = req.body.description
        if(req.body.completed) update.completed = Number(req.body.completed)
        if(req.body.servicePoint) update.servicePoint = (await ServicePoint.findOne({name: req.body.servicePoint}))._id
        if(req.body.status){
            update.status = req.body.status
            if(update.status === "Cerrada"){
                update.closed = {date: new Date(), user: ( await User.find({idNumber : req.body.userId}) ).id}
                update.completed = 100
            }
        }
        await WorkOrder.updateOne({code}, update) 
        const stored = await getListData(code)
        res.status(200).send(buildOrder(stored))
    }catch(e){
        console.log(e)
        res.status(400).send({error: e.message})
    }

}

module.exports = {
    getByDevice,

    getMostRecent, getOptions, addOrder, getWObyId, getWOList, deleteWorkOrder, updateWorkOrder}