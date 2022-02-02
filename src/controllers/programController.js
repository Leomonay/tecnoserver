const Program = require('../models/Program')
const User = require('../models/User')
const Plant = require('../models/Plant')
const Device = require('../models/Device')
const WorkOrder = require('../models/WorkOrder')

function buildProgram(program){
    const devicePlans =
        program.deviceList.map(element=>{
            const {cost, dates, responsible, observations, frequency, completed} = element
            return {
                device: element.device.code,
                frequency,
                cost,
                responsible: responsible?
                    {id: responsible.idNumber, name: responsible.name}
                    :undefined,
                observations,
                dates,
                workOrders: element.workOrders,
                completed
            }
        })

    return{
        _id: program._id,
        name: program.name,
        plant: program.plant.name,
        year: program.year,
        supervisor: {id: program.supervisor.idNumber, name: program.supervisor.name},
        people: program.people.map(element=>({id: element.idNumber, name: element.name})),
        description: program.description,
        deviceList: devicePlans
    }
}

async function addToProgram(req,res){
    console.log('req.body',req.body)
    let results = {created:[], errors:[]}
    const {program, device} = req.body
    const {frequency, cost, observations} = program
    const plant = await Plant.findOne({name: program.plant})
    const responsible = program.responsible ? 
        ( await User.findOne({idNumber: program.responsible.id}) )._id
        :undefined
    const devices = await Device.find({code:device})
    const planned = {
        responsible, 
        cost,
        observations,
        frequency,
        planned: [],
        // workOrders: [],
        completed: 0
    }

    for await (let device of devices){
        try{
            await Program.findOneAndUpdate(
                {plant:plant._id, year: program.year, name:program.name},
                {$push:{'deviceList':{
                    device: device._id,
                    ...planned
                }}}
            )
            results.created.push(device.code)
        }catch(e){
            results.errors.push({
                code: device.code,
                name: device.name,
                error: e.message
            })
        }
    }
    results.created = {
        device: results.created,
        program: {
            name:program.name,
            ...planned,
            responsible: responsible?
                {id: responsible.idNumber, name: responsible.name}
                :undefined}
    }
    res.status(200).send(results)
}

async function getPlan(req,res){
    const {plantName,year} = req.query
    const plant = ( await Plant.find(
        plantName?
        {name: plantName}
        :{}) ).map(plant=>plant._id)

    const plan = await Program.find({...{plant},...{year}})
        .populate({path:'plant',select:'name'})
        .populate({
            path: 'supervisor',
            select:['idNumber', 'name']})
        .populate({
            path:'deviceList',
            populate:[
                {
                    path:'device',
                    select:['code','name']
                },
                {
                    path: 'responsible',
                    select: ['idNumber', 'name']
                }
            ]
        })

    let deviceList = []   
    for (let program of plan){
        for (let device of program.deviceList){
            deviceList.push({
                year: program.year,
                plant: program.plant.name,
                deviceCode: device.code,
                deviceName: device.name,
                program: {
                    name: program.name,
                    programTitle: program.description,
                    supervisor: program.supervisor.name,
                    responsible: device.responsible.name,
                    date: device.date,
                    cost: device.cost,
                    observations: device.observations
                }
            })
        }
    }
    res.status(200).send(deviceList)
}

async function devicePlanList(req,res){
    const {plantName,year} = req.query
    const today = new Date()
    
    try{
        //building plan
        const plant = (await Plant.find(
            plantName?
                {name:plantName}
                :{})).map(plant=>plant._id)

        console.log({...{plant},...{year}})
        
        const plan = await Program.find({...{plant},...{year}})
            .populate({
                    path:'deviceList',
                    populate: ['device', 'responsible']
                })
            .populate({
                path:'plant',
                select: 'name'
                })
        
        // building reclaimed
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
        
        //building deviceList
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

        // planDevices.splice(10)

        const deviceList=[]

        for (let device of planDevices){
            if (!plantName || plantName && device.line.area.plant.name===plantName) {
                    let inReclaimed = reclaimed.find(element=>
                        JSON.stringify(element._id)===JSON.stringify(device._id))

                    const program = plan.find(program=>
                        program.deviceList.map(element=>element.device.code).includes(device.code))
                
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
                    refrigerant: device.refrigerant? device.refrigerant.refrigerante || "S/D" : "S/D",
                    reclaims: inReclaimed? inReclaimed.reclaims: 0,
                }
                if(program){
                    const plant = program.plant.name
                    const {year, name} = program
                    const programDetail = plan.find(element=>
                        element.name===program.name).deviceList.find(element=>
                                element.device.code===device.code)
                    const {planned, frequency, cost, observations} = programDetail
                    const responsible = programDetail.responsible?{
                        id: programDetail.responsible.idNumber,
                        name: programDetail.responsible.name,
                    }:undefined
                    newDevice.program = {...{plant,year,name,planned,frequency,cost,observations,responsible}}
                }
                
                deviceList.push(newDevice)
            }
        }
        res.status(200).send(deviceList)
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function createProgram(req, res){
    try{
        const {name, people, year, description}  = req.body
        const plant = await Plant.findOne({name: req.body.plant})
        const supervisor = await User.findOne({idNumber: req.body.supervisor})
        const workers = await User.find({idNumber: people})
        const newProgram = await Program({
            plant,
            year,
            name,
            description,
            supervisor,
            people: workers.map(e=>e._id) || undefined,
            deviceList:[]
        })

        newProgram.save()
        res.status(200).send(buildProgram(newProgram))
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function updateDeviceProgram(req,res){
    console.log('req.body',req.body)
    const results = {updated:[], errors:[]}
    try{
        const {device, program}=req.body
        const {name, year, frequency, planned, cost, observations, completed}=program

        //deviceList
        const devices = await Device.find({code: device})
        //building update object
        const responsible = program.responsible ? 
            ( await User.findOne({idNumber: program.responsible.id}) )
            :undefined
        const update = {
            planned:planned? planned.map(plan=>({...plan,date:new Date(plan.date)})) : [],
            cost,
            responsible: responsible._id,
            observations,
            frequency,
            completed: completed||0}

        //building programs list for given plant & year
        const plant = await Plant.findOne({name: program.plant})
        const programs = await Program.find({year, plant: plant._id})
            .populate({path:'deviceList', populate:'device'})
        
        for await (let device of devices){
            update.device=device._id
            //find current program for each device
            const current = programs.find(program=>
                program.deviceList.map(element=>
                    element.device.code).includes(device.code))

            // device registered in other program
            const index = current.deviceList.findIndex(element=>element.device.code===device.code)

            //if program changes
            if(current.name!=name){
                await Program.findOneAndUpdate(
                    {_id:current._id},
                    {$pull: {deviceList: {'device':device._id}}})
                await Program.findOneAndUpdate({name},
                    {$push: {deviceList: update}})
                results.updated.push(device.code)
            }else if(current.name===name){
                await Program.findOneAndUpdate(
                    {_id:current._id},
                    {$set: {['deviceList.'+index]:update}}
                )
                results.updated.push(device.code)
            }else{
                results.errors.push({code:device.name, detail: `program not found`})
            }
        }
        results.updated = {
            device: results.updated,
            program: {
                name,
                ...update,
                responsible: responsible?
                    {id: responsible.idNumber, name: responsible.name}
                    :undefined
                }
        }
    }catch(e){
        results.errors.push({code: 'system', detail: e.message})
    }
    console.log(results)
    res.status(200).send(results)
}

async function updateProgram(req, res){
    try{
        const {id, update}  = req.body
        if(update.plant) update.plant = ( await Plant.findOne({name: update.plant}) )._id
        if(update.people) update.people = ( await User.find({idNumber: update.people}) ).map(e=>e._id)
        if(update.supervisor) update.supervisor = ( await User.findOne({idNumber: update.supervisor.id}) )._id

        await Program.findOneAndUpdate({_id:id},update)
        const updated = await Program.findOne({_id:id})
            .populate(['plant', 'supervisor','people'])
            .populate({path:'deviceList', populate: 'device'})
        res.status(200).send(buildProgram(updated))
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function allPrograms(req, res){
    const {plantName, year} = req.query
    const plant = await Plant.find(plantName?{name: plantName}:{})
    const filters = {}
        if(plant) filters.plant=plant.map(plant=>plant._id)
        if(year) filters.year=year

    const programs = await Program.find(filters)
        .populate(['plant', 'supervisor','people'])
        .populate({path:'deviceList', populate: ['device', 'responsible']})
    const response = programs.map(buildProgram)
    res.status(200).send(response)  
}

module.exports = {
    createProgram,
    allPrograms,
    updateProgram,
    addToProgram,
    getPlan,
    devicePlanList,
    updateDeviceProgram
}