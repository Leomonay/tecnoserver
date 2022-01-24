const Program = require('../models/Program')
const User = require('../models/User')
const Plant = require('../models/Plant')
const Device = require('../models/Device')
const WorkOrder = require('../models/WorkOrder')

function buildProgram(program){
    return{
        _id: program._id,
        name: program.name,
        plant: program.plant.name,
        year: program.year,
        supervisor: {id: program.supervisor.idNumber, name: program.supervisor.name},
        people: program.people.map(element=>({id: element.idNumber, name: element.name})),
        description: program.description,
        deviceList: program.deviceList || []
    }
}

async function addDevice(plan, program){
    const {device, cost, date, month, responsible, observations, workOrders, completed}=plan
    program.deviceList.push({
        device: device._id,
        date: date? new Date(date) : month? new Date(`${program.year}/${month}/01`) : undefined,
        cost: cost || undefined,
        responsible: responsible || undefined,
        observations:observations ||undefined,
        workOrders: workOrders || undefined,
        completed: completed || undefined,
    })
    program.save()
}

async function addToProgram(req,res){
    let results = {created:[], errors:[]}
    const {program, device, month, date, cost, responsible,observations, year} = req.body
    const plant = await Plant.findOne({name: req.body.plant})
    const worker = await User.findOne({idNumber: responsible})
    const devices = await Device.find({code:device})
    const planned = {
        date: date? new Date (date) : (month+1? new Date(`${year}/${month+1}/01`) : undefined),
        responsible: worker? worker._id : undefined, 
        cost,
        observations,
        workOrders: [],
        completed: 0
    }
    
    for await (let device of devices){
        try{
            await Program.findOneAndUpdate(
                {plant,year, name:program},
                {$push:{'deviceList':{
                    device: device._id,
                    ...planned
                }}}
            )
            results.created.push(device.code)
        }catch(e){
            results.errors.push({
                code: device.code,
                name: device.name
            })
        }
    }
    results.created = {
        device: results.created,
        program: {name:program, ...planned, responsible:{id: worker.idNumber, name: worker.name}}
    }
    res.status(200).send(results)
}

async function getPlan(req,res){
    const {plantName,year} = req.query
    const plant = ( await Plant.find(
        plantName?
        {name: plantName}
        :{}) ).map(plant=>plant._id)
    // const planFilters = {}
    // if(plants) planFilters.plant = plants.map(plant=>plant._id)
    // if(year) year = Number(year)

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
                :{})).map(program=>program._id)
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

        // console.log(planDevices[0])

        // planDevices.splice(15)
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
                    const {date, cost, observations} = programDetail
                    const responsible = programDetail.responsible?{
                        id: programDetail.responsible.idNumber,
                        name: programDetail.responsible.name,
                    }:undefined
                    newDevice.program = {...{plant,year,name,date,cost,observations,responsible}}
                }
                
                deviceList.push(newDevice)
            }
        }
        console.log('deviceList[0]',deviceList[0])
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
    const results = {updated:[], errors:[]}
    try{
        const {year,program, date, month, cost, observations, completed}=req.body

        //deviceList
        const devices = await Device.find({code: req.body.device})
        //building update object
        const workOrders = await WorkOrder.find({code:req.body.workOrders})
        const responsible = await User.findOne({idNumber: req.body.responsible})
        const update = {
            date: date? new Date (date) : (month+1? new Date(`${year}/${month+1}/01`) : undefined),
            cost,
            responsible: responsible? responsible._id : undefined,
            observations,
            workOrders:  workOrders.length>0 ? workOrders : undefined,
            completed: completed||0}

        //building programs list for given plant & year
        const plant = await Plant.findOne({name: req.body.plant})
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
            if(current.name!=program){
                await Program.findOneAndUpdate(
                    {_id:current._id},
                    {$pull: {deviceList: {'device':device._id}}})
                await Program.findOneAndUpdate({name:program},
                    {$push: {deviceList: update}})
                results.updated.push(device.code)
            }else if(current.name===program){
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
            program: {name:program, ...update, responsible:{id: responsible.idNumber, name: responsible.name}}
        }
    }catch(e){
        results.errors.push({code: 'system', detail: e.message})
    }
    res.status(200).send(results)
}

async function updateProgram(req, res){
    try{
        const {id, update}  = req.body
        if(update.plant) update.plant = ( await Plant.findOne({name: update.plant}) )._id
        if(update.people) update.people = ( await User.find({idNumber: update.people}) ).map(e=>e._id)
        if(update.supervisor) update.supervisor = ( await User.findOne({idNumber: update.supervisor.id}) )._id

        await Program.findOneAndUpdate({_id:id},update)
        const updated = await Program.findOne({_id:id}).populate(['plant', 'supervisor','people'])
        res.status(200).send(buildProgram(updated))
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function allPrograms(req, res){
    const {plantName, year} = req.query
    const plant = await Plant.findOne({name: plantName})
    const filters = {}
        if(plant) filters.plant=plant.name
        if(year) filters.year=year
    const programs = await Program.find(filters).populate(['plant', 'supervisor','people'])
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