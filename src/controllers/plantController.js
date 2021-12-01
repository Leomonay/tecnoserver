const Area = require('../models/Area');
const Plant = require ('../models/Plant')
const Line = require ('../models/Line')
const ServicePoint = require ('../models/ServicePoint')

async function addPlant (req,res){
    try{
        const {name,code}=req.body;       
        const checkPlant = await Plant.find({name:name}).lean().exec()
        if(checkPlant.length>0){
            res.status(400).send({message: 'La planta ya existe'})
        }else{
            const plant = Plant({name,code})
            const plantStored = await plant.save()
            res.status(201).send({plantStored})
        }
    }catch (e){
        res.status(500).send({message: e.message})
    }
}

async function getPlantByName (plantName){
    return (await Plant.findOne({name:plantName}))
}
async function getPlantByCode (plantCode){
    return (await Plant.findOne({code:plantCode}))
}

async function getPlantNames (req,res){
    const plants = (await Plant.find().lean().exec()).map(plant=>plant.name)
    const plantList={}
    plants.map(plant=>plantList[plant]={})
    res.status(200).send(plantList)
}

async function locationOptions(req, res){
    const {plantName} = req.params
    const locationTree = {}
    const plant = await Plant.findOne({name: plantName})
    for await (let areaId of plant.areas){
        const area = await Area.findOne({_id: areaId}).populate('lines')
        locationTree[area.name]=area.lines.map(line=>line.name)
    }
    res.status(200).send({plant: plantName, tree: locationTree})
}

module.exports={
    addPlant,
    getPlantNames,
    getPlantByCode,
    getPlantByName,
    locationOptions,
}