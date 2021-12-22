const Plant = require('../models/Plant'); 
const Area = require('../models/Area');
const Line = require('../models/Line');
const Device = require('../models/Device');
const Refrigerante = require('../models/Refrigerante')
const ServicePoints = require('../models/ServicePoint')
const DeviceOptions = require('../models/DeviceOptions');

async function buildDevices(filters,pages){
    let deviceList=[]
    const devices = await Device.find(filters)
        .select('-__v')
        .limit(pages&&pages.size||30)
        .skip(pages&&(pages.current-1)*pages.size||0)
        .populate('refrigerant')
        .populate('servicePoints')
        .populate({path: 'line', select: 'name', populate: (
            {path: 'area', select:'name', populate:(
                {path: 'plant', select: 'code'}
            )})
        })
        .sort('code')
    for await(let device of devices){
        deviceList.push({
            plant: device.line.area.plant.code,
            area: device.line.area.name,
            line: device.line.name,
            code: device.code,
            name: device.name,
            type: device.type,
            powerKcal: device.power.magnitude,
            powerTnRef: Number((device.power.magnitude/3000).toFixed(1)),
            refrigerant: device.refrigerant ? device.refrigerant.refrigerante : '',
            service: device.service,
            status: device.status,
            category: device.category,
            regDate: device.regDate,
            environment: device.environment,
            servicePoints: device.servicePoints?device.servicePoints.map(sp=>sp.name):[]
        })
    }
    return deviceList
}

async function getDevices(req,res){
    const {pageSize, current} = req.query
    const pages ={size: pageSize, current: current}
    const {plant, area, line, filters} = req.body
    if(plant){
        try{
            let dbPlant=null, dbArea=null, dbLine=null
            let deviceList = []
            
            if (line){
                dbLine = await Line.findOne({name:line})
                filters.line={_id: dbLine._id}
            }else if (area){
                dbArea = await Area.findOne({name:area})
                filters.line={$in: dbArea.lines}
            }else{
                dbPlant = await Plant.findOne({code:plant})
                const areas = await Area.find({_id: dbPlant.areas})
                let linesIDs=[]
                for await (let dbArea of areas){
                    linesIDs = linesIDs.concat( dbArea.lines)
                }
                filters.line={$in: linesIDs}
            }
            deviceList = await buildDevices(filters,(pageSize&&current?pages:''))
            res.status(200).send({quantity: deviceList.length, list:deviceList})
        }catch(e){
            console.log(e.message)
            res.status(400).send({error: e.message})
        }
    }else{
        res.status(400).send({error: 'You must at least send the Plant Code'})
    }
}
async function allDevices(req,res){
    const size = parseInt(req.query.size),
        page = parseInt(req.query.page)
    try{
        const devices = await buildDevices({},{size: size||50, current: page||1})
        let success={}
        if(page>1) success.prev= `${process.env.APP_URL}/v1/devices?size=${size||50}&page=${page-1}`
        success.next = `${process.env.APP_URL}/v1/devices?size=${size||50}&page=${page+1||2}`,
        success.items = devices.length
        success.results = devices
        res.status(200).send(success)
    }catch(e){
        console.log(e)
        res.status(500).send(e.message)
    }
}

async function getDeviceFilters(req, res){
    const {plant} = req.query
    const bdPlant = await Plant.findOne({code: plant})
    const areas = await Area.find({_id: bdPlant.areas})
    let lineFilter=[]
    for await (let area of areas){
        const lines = await Line.find({_id : area.lines})
        for (let line of lines){
            lineFilter.push({
                name:line.name,
                area: area.name
            })
        }
    }
    const options = await DeviceOptions.findOne({name:'DeviceFeatures'})
    let filters ={
        area: areas.map(area=>area.name),
        line: lineFilter,
        type: options.types,
        category: options.category
    }
    res.status(200).send(filters)
}

async function devicesByLine(req, res){
    const {lineName} = req.params
    const line = await Line.findOne({name:lineName})
    const devices = await Device.find({line:line})
    res.status(200).send(
        devices.map(device=>{return{code: device.code, name: device.name}}))
}
async function devicesByName(req, res){
    const {name} = req.params
    const devices = await Device.find({name:{$regex: name, $options: 'i'}})
    res.status(200).send(
        devices.map(device=>{return{code: device.code, name: device.name}}))
}

module.exports={
    allDevices,
    getDeviceFilters,
    getDevices,
    devicesByLine,
    devicesByName
}