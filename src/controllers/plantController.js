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

async function getPlantByName (req,res){
    try{
        let {name} = req.params
        let plant = await Plant.findOne({name:name})
        let planta = {name: plant.name, code: plant.code}
        res.status(200).send(planta)
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
}

async function getPlantByCode (plantCode){
    return (await Plant.findOne({code:plantCode}))
}

async function getPlantNames (req,res){
    try{
        const plants = (await Plant.find().lean().exec()).map(plant=>plant.name)
        const plantList={}
        plants.map(plant=>plantList[plant]={})
        res.status(200).send(plantList)
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
}

async function locationOptions(req, res){
    try{
        const {plantName} = req.params
        const locationTree = {}
        const plant = await Plant.findOne({name: plantName})
        for (let areaId of plant.areas){
            const area = await Area.findOne({_id: areaId}).populate('lines')
            locationTree[area.name]=area.lines.map(line=>line.name)
        }
        res.status(200).send({plant: plantName, tree: locationTree})
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
}

async function deletePlant (req,res){
    try{
        const {name}=req.body;       
        const checkPlant = await Plant.find({name:name}).lean().exec()
       if(checkPlant.length>0){
            let code = checkPlant.code
            const plant = Plant({name,code})
            const plantDeleted = await Plant.deleteOne({name: name})
            res.status(201).send({plantDeleted})
        }else{
            res.status(400).send({message: 'La planta no existe'})
        }
    }catch (e){
        res.status(500).send({message: e.message})
    }
}

async function updatePlant (req,res){
    try{
        const {newName, newCode, oldName, oldCode}=req.body;       
          const checkPlant = await Plant.find({name:oldName}).lean().exec()
       if(checkPlant.length>0){

            const plantUpdated = await Plant.updateOne({name: oldName}, {name: newName, code: newCode})
            res.status(201).send({plantUpdated})
        }else{
            res.status(400).send({message: 'La planta no existe'})
        }
    }catch (e){
        res.status(500).send({message: e.message})
    }
}


module.exports={
    addPlant,
    getPlantNames,
    getPlantByCode,
    getPlantByName,
    locationOptions,
    deletePlant,
    updatePlant
}