const Plan = require('../models/Plan')
const Device = require('../models/Device')
const Plant = require('../models/Plant')
const Program = require ('../models/Program')
const WorkOrder = require('../models/WorkOrder')
const User = require('../models/User')

async function addToPlan(req, res){
    console.log(req.body)
    const results = {ok:0,errors:[]}
    const {device, program, observations, responsible, month, cost} =req.body
    const deviceProgram = await Program.findOne({_id:program})
    const planPlant = await Plant.findOne({_id: deviceProgram.plant})
    const worker = await User.findOne({name:responsible}) 
    const devices = await Device.find({code:device})

    // device:
    // program:
    // cost:
    // observations:
    // date:
    // responsible:
    // workOrders:
    // Completed:
    
    for await (let device of devices){
        const newPlanLine = {
            year: deviceProgram.year,
            plant: planPlant._id,
            device: device._id,
            program: deviceProgram._id,
            supervisor: deviceProgram.supervisor,
        }
        if(month) newPlanLine.date = new Date (`${program.year}/${month}/01`)
        if(observations) newPlanLine.comments = observations
        if(responsible) newPlanLine.responsible = worker._id
        const planLine = await Plan(newPlanLine)
        await planLine.save()
        console.log(planLine)
        results.ok++
    }

    res.status(200).send(results)
}




async function getPlan(req,res){
    const {plant,year} = req.query
    const filter = {}
    if(plant) filter.plant = (await Plant.findOne({name:plant}) )._id
    if(plant) filter.year = year
    const plan = await Program.find(filter)
    res.status(200).send(plan)
}

async function planDeviceList(req, res){
    // console.log('req.body', req.body)
    const today = new Date()
    const plantName  = req.body.plantName || req.query.plant
    const year  = req.body.year || req.query.year
    const plant = await Plant.findOne({name: plantName})
    const planFilters = {}
    if(plantName && plantName!='') planFilters.plant = plant._id
    if(year) planFilters.year = Number(year)

    console.log('planFilters', planFilters)

    const plan = await Program.find(planFilters).populate('deviceList')
    // console.log(plan)

    let reclaimed = await WorkOrder.aggregate([
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
            reclaims: {$count:{}}
        }},
        {$lookup:{
            from: 'Device',
            localField: '_id',
            foreignField: 'code',
            as: 'deviceCode'
        }}
    ])

    // const planDevicesV2 = await Program.find({plant:plant, year:year})
    //     .populate({
    //         path: 'devices',
    //         select: ['code','name'],
    //         populate:{
    //             path:'line', 
    //             select:['code', 'name'],
    //             populate:[
    //                 {
    //                     path: 'area',
    //                     select: ['code', 'name'],
    //                     populate: {
    //                         path: 'plant',
    //                         select: 'name',
    //                     }
    //                 },
    //                 {
    //                     path: 'servicePoints',
    //                     select:'name'
    //                 },
    //                 {
    //                     path: 'refrigerant',
    //                     select: 'refrigerante'
    //                 },
    //                 {path: 'servicePoints'},
    //                 {path: 'refrigerant'}
    //             ]
    //         }
    //     })
    // planDevicesV2.splice(3)



    const planDevices = await Device.find({},'-_id')
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

    planDevices.splice(3)

    let deviceList=[]
    const thisYear = ( new Date () ).getFullYear()

    for (let device of planDevices){
        if (!plantName || plantName && device.line.area.plant.name===plantName) {
                const inReclaimed = reclaimed.find(element=>
                JSON.stringify(element._id.device)===JSON.stringify(device._id))
                const program = plan.find(program=>
                    program.deviceList.map(device=>device.id).includes(device._id))
            
            const newDevice = {
                code: device.code,
                name: device.name,
                type: device.type,
                power: device.power.magnitude,
                service: device.service,
                status: device.status,
                category: device.category,
                environment: device.environment,
                age: thisYear - ( new Date(device.regDate) ).getFullYear(), 
                line: device.line.name,
                area: device.line.area.name,
                plant: device.line.area.plant.name,
                active: device.active,
                servicePoints: device.servicePoints ? device.servicePoints.map(e=>e.name) : [],
                refrigerant: device.refrigerant? device.refrigerant.refrigerante || "S/D" : "S/D",
                reclaims: inReclaimed? inReclaimed.reclaims: 0,
            }
            if(program){
                let deviceProgram = {name: program.name}
                const programDetail = plan.find(element=>
                    element.name===program.name).devices.find(element=>
                            element.id===device._id)
                if(programDetail.date) deviceProgram.date = programDetail.date
                if(programDetail.responsible) deviceProgram.responsible = programDetail.responsible
                if(programDetail.observations) deviceProgram.comments = programDetail.comments
                newDevice.program = deviceProgram
            }
            
            deviceList.push(newDevice)
        }
    }
    console.log(deviceList[0])
    // res.status(200).send(deviceList)
    res.status(200).send(deviceList)
}

module.exports={
    addToPlan,
    planDeviceList
}