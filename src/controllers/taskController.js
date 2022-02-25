const User = require('../models/User')
const Plant = require('../models/Plant')
const Device = require('../models/Device')
const Strategy = require('../models/Strategy')
const Task = require('../models/Task')
const WorkOrder = require('../models/WorkOrder')
const TaskDates = require('../models/TaskDates')

async function setTasks(req,res){
    let results = {created:[], errors:[]}
    try{
        // get body data
        const {device} = req.body
        const {year, name, frequency, cost, observations} = req.body.program
        // build task data
        const data = {year, name, frequency, observations}
        const plant = await Plant.findOne({name: req.body.program.plant})
        const strategy = await Strategy.findOne({year, plant:plant.id, name})
        const responsible = req.body.program.responsible ? 
            await User.findOne({idNumber: req.body.program.responsible.id})
            :undefined
        data.cost = cost || 0
        data.plant = plant._id
        data.strategy = strategy._id
        data.responsible = responsible && responsible._id

        // create or update data for devices
        const devices = await Device.find({code:device})
        try{
            for await (let device of devices){
                const currentTask = await Task.findOne({device: device._id, strategy: strategy._id})
                currentTask? await Task.findOneAndUpdate({_id: currentTask._id},data)
                : (await Task({device: device._id,...data}) ).save()
                results.created.push(device.code)
            }
        }catch(e){
            results.errors.push({
                code: device.code,
                name: device.name,
                error: e.message
            })
        }
        results.created={device: results.created, strategy: {...data,
            plant: plant.name,
            strategy: strategy.name,
            responsible: {id: responsible.idNumber, name: responsible.name}
        }}
        res.status(200).send(results)
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function addOrderToTask(req,res){
    const {order} = req.body
    const date = new Date (req.body.date)
    console.log('date',date)
    const workOrder = await WorkOrder.findOne({code:order})
        .populate({path:'device', select:['_id','code','line'], populate:{
            path:'line', select:'name',populate:{
                path:'area', select:'name', populate:{
                    path: 'plant', select:['_id', 'name']
                }}}})
    console.log('order',workOrder.code)
    const strategies = await Strategy.find({plant: workOrder.device.line.area.plant._id, year: date.getFullYear()})
    console.log('strategies',strategies.length)
    const task = await Task.findOne({strategy: strategies.map(s=>s._id), device: workOrder.device._id})
    console.log('task',task)
    const taskDate = await TaskDates.findOne({task: task._id, date})
    console.log('taskDate',taskDate)
    if(!taskDate) throw new Error (`Tarea no encontrada`)
    res.status(200).send(await TaskDates.findByIdAndUpdate(taskDate._id, {$push: {workOrders:workOrder._id}}))
}



async function taskDeviceList(req,res){
    const {plantName,year}=req.query
    // try{
        //taskList    
        const dBPlant = await Plant.find(plantName?{name: plantName}:{})
        const filter = {year}
        const plant = dBPlant[0]? dBPlant.map(plant=>plant._id) : undefined
        if(plant) filter.plant=plant
        const strategy = await Strategy.find(filter)
        const plan = await Task.find({strategy: strategy.map(e=>e._id)})
            .populate(['device','responsible'])
            .populate({
                path:'strategy',
                populate: {path: 'plant', select:'name'}})

        //deviceList
        const planDevices = await Device.find({active:true})
        .populate({
            path:'line', 
            select:['code', 'name'],
            populate:{
                path: 'area',
                select: ['code', 'name'],
                populate: {
                    path: 'plant',
                    select: 'name',
                }
            }
        })
        .populate({path: 'servicePoints', select:'name'})
        .populate({path: 'refrigerant', select: 'refrigerante'})
        .populate(['servicePoints','refrigerant'])
        .lean()
        .exec()

        //reclaimsList
        const today = new Date()
        const reclaimed = await WorkOrder.aggregate([
            {$match:{
                $and:[
                    {class:"Reclamo"},
                    {'registration.date': {
                        $gte: new Date(`${year-1||today.getFullYear()-1}/01/01`),
                        $lte: new Date(`${year-1||today.getFullYear()-1}/12/31`)}
                    }]
                },
            },
            {$group:{
                _id: '$device',
                reclaims: {$sum:1}
            }},
            {$lookup:{
                from: 'Device',
                localField: '_id',
                foreignField: 'code',
                as: 'deviceCode'
            }}
        ])

        const deviceList=[]

        for (let device of planDevices){
            if (!plantName || plantName && device.line.area.plant.name===plantName) {
                let inReclaimed = reclaimed.find(element=>
                    JSON.stringify(element._id)===JSON.stringify(device._id))
                const task = plan.find(task=>task.device.code===device.code)
                
                const newDevice = {
                    code: device.code,
                    name: device.name,
                    type: device.type,
                    power: device.power.magnitude,
                    service: device.service,
                    status: device.status,
                    category: device.category,
                    environment: device.environment,
                    age: (new Date()).getFullYear() - ( new Date(device.regDate) ).getFullYear(), 
                    line: device.line.name,
                    area: device.line.area.name,
                    plant: device.line.area.plant.name,
                    active: device.active,
                    servicePoints: device.servicePoints ? device.servicePoints.map(e=>e.name) : [],
                    refrigerant: device.refrigerant? (device.refrigerant.refrigerante || "S/D") : "S/D",
                    reclaims: inReclaimed? inReclaimed.reclaims: 0,
                }
                if(task){
                    const plant = task.strategy.plant.name
                    const {year, name} = task.strategy
                    const {frequency, cost, observations} = task
                    const responsible = task.responsible?{
                        id: task.responsible.idNumber,
                        name: task.responsible.name,
                    }:undefined
                    newDevice.strategy = {...{plant,year,name,frequency,cost,observations,responsible}}
                }
                deviceList.push(newDevice)
            }
        }
        res.status(200).send(deviceList)
    // }catch(e){
    //     res.status(400).send({error: e.message})
    // }
}

module.exports = {
    setTasks,
    taskDeviceList,
    addOrderToTask
}