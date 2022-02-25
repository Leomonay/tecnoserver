const Plant = require('../models/Plant')
const Strategy = require('../models/Strategy')
const Task = require('../models/Task')
const TaskDate = require('../models/TaskDates')
const Device = require('../models/Device')
const User = require('../models/User')

async function getDates(req,res){
    const {year}=req.query
    const plant = await Plant.find(req.query.plant?{name:req.query.plant}:{})
    const strategies = await Strategy.find({year,plant: plant.map(plant=>plant._id)})
        .populate({path: 'plant', select: 'name'})
    const tasks = await Task.find({strategy: strategies.map(s=>s._id)})
        .populate('device')
        .populate('strategy')
        .populate('responsible')
    const dates = await TaskDate.find({task: tasks.map(task=>task._id)})
        .populate({path: 'task', populate:{path:'device', select: 'code'}})
        .populate({path:'workOrders', select: 'code'})
    let deviceList = []
    for (let task of tasks){
        const {code, name} = task.device
        let deviceTask = { code, name }
        deviceTask.strategy = task.strategy.name
        deviceTask.responsible = {id: task.responsible.idNumber, name: task.responsible.name}
        deviceTask.frequency = task.frequency
        deviceTask.dates = dates.filter(date=> date.task.device.code === task.device.code).map(element=>element.date)
        deviceList.push(deviceTask)
    }
    res.status(200).send(deviceList)
}

async function addDates(req, res){
    const {year, dates} = req.body
    const device = await Device.findOne({code: req.body.device})
        .populate({path: 'line', select:'name',
            populate: {path: 'area', select:'name',
                populate: {path: 'plant', select:'name'}}})
    
    const plant = await Plant.findOne({name: device.line.area.plant.name}) 
    const strategy = await Strategy.findOne({plant: plant._id, year, name: req.body.strategy}) 
    const task = await Task.findOne({strategy: strategy._id, device:device._id})
    await TaskDate.deleteMany({task: task._id, workOrders:[]})
    
    dateList=[]
    for await (let date of dates){
        const newDate = await TaskDate({
            task: task._id,
            date: new Date(date),
            completed:0
        })
        await newDate.save()
        dateList.push(newDate)
    }
    res.status(200).send(dateList)
}

async function getPlan(req, res){
    const year = Number(req.query.year)
    const plantName = req.query.plant
    const user = await User.findOne({username: req.query.user})
    const plant = await Plant.find(plantName?{name: plantName}:{})
    const strategies = await Strategy.find({year,plant: plant.map(plant=>plant._id)})
    const tasks = await Task.find({strategy: strategies.map(s=>s._id)})
    const dates = await TaskDate.find({task: tasks.map(task=>task._id)})
        .populate([{
            path: 'task', populate: [{
                path: 'responsible', select: ['idNumber', 'name']
            },{
                path:'device', select: ['code', 'name'], populate: {
                    path: 'line', select: 'name', populate:{
                        path: 'area', select: 'name'
                    }
                }
            },{
                path: 'strategy', populate: {path: 'supervisor', select: ['idNumber', 'name']}
            }]
        },{
            path: 'workOrders', select:['code', 'completed']
        }])
    let plan = []
    for (let date of dates){
        if(user && !(user.access==='Worker' && date.task.responsible.idNumber!==user.idNumber
        || user.access==='Supervisor' && date.task.strategy.supervisor.idNumber!==user.idNumber))
        plan.push({
            plant: plantName,
            area: date.task.device.line.area.name,
            line: date.task.device.line.name,
            code: date.task.device.code,
            device: date.task.device.name,
            date: new Date (date.date),
            strategy: date.task.strategy.name,
            responsible: {id: date.task.responsible.idNumber, name: date.task.responsible.name},
            supervisor: {id: date.task.strategy.supervisor.idNumber, name: date.task.strategy.supervisor.name},
            observations: date.task.observations,
            completed: date.workOrders[0] ?
                date.workOrders.map(ot=>ot.completed).reduce((a,b)=>a+b,0) / date.workOrders.length
                : 0
        })
    }
    res.status(200).send(plan.sort((a,b)=>a.date>b.date?1:-1))
}

module.exports={
    getDates,
    addDates,
    getPlan
}