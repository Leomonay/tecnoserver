const Area = require ('../models/Area')
const Plant = require ('../models/Plant')
const mongoose = require('mongoose')

async function addAreaFromApp(req,res){
    const {areas,plantCode} = req.body
    let results = []
    for (let area of areas){
        const result = await addArea(area.name,area.code, plantCode)
        results=[...results,result]
    }    
    res.status(200).send(results)
}

async function addArea(areaName, areaCode, plantCode){
    try{
        const plant = await Plant.findOne({code:plantCode})
        const area = await Area({
            name: areaName,
            code: areaCode,
            plant: plant._id
        })
        const areaStored = await area.save()
        await plant.areas.push(mongoose.Types.ObjectId(areaStored._id))
        await plant.save()
        return {success: true, area: areaStored};
    }catch(e){
        return {success: false, error: e.message}
    }
}

async function getAreas (req,res){
    const areas = await Area.find({}).lean().exec()
    //find: mongoose method - lean: convert to JS class - exec: execute query
    res.status(200).send({areas: areas.map(e=>e.name)})
}

async function deleteArea(areaName){
    try{
        const area = await Area.findOne({name:areaName})
        const plant = await Plant.findOne({areas:area._id})
        await plant.areas.pull(area._id)
        await plant.save()
        await Area.deleteOne({name: areaName})
        return {success: true, name:areaName}
    }catch(e){
        return {success: false, name: areaName, error:e.message}
    }
}

async function deleteOneArea(req,res){
    
    const areaName = req.body.name
    let response = await deleteArea(areaName)
    if(response.success)
    res.status(201).send({response})
}

async function getAreaByName (req,res){
    let {name} = req.params
    let area = await Area.findOne({name:name})
    let result = {name: area.name, code: area.code}
      res.status(200).send(result)
}

async function updateArea (req,res){
    try{
        const {newName, newCode, oldName, oldCode}=req.body;       
          const checkArea = await Area.find({name:oldName}).lean().exec()
       if(checkArea.length>0){

            const areaUpdated = await Area.updateOne({name: oldName}, {name: newName, code: newCode})
            res.status(201).send({areaUpdated})
        }else{
            res.status(400).send({message: 'El área no existe'})
        }
    }catch (e){
        res.status(500).send({message: e.message})
    }
}












async function checkArea(areaName){
    return await Area.findOne({name:areaName}).lean().exec()
}



async function deletePlantAreas(req, res){
    var results=[]
    const allAreas = await Area.find({}).lean().exec()
    const areas = allAreas.map(e=>e.name)
    req = {areas:areas}
    try{
        for await (area of areas){results.push(await deleteArea(area))}
        res.status(200).send({borrados: results.length, detalle: results.map(e=e.name)})
    }catch (e) {
        res.status(400).send([{
                    borrados: results.filter(e=>e.success==true).length,
                    nombres: results.filter(e=>e.success==true).map(e=>e.name) 
                },
                {
                    fallaron: results.filter(e=>e.success==false).length,
                    nombres: results.filter(e=>e.success==false).map(e=>[{name: e.name, error: e.error}]) 
                }])
    }
}


module.exports={
    addAreaFromApp,
    getAreas,
    checkArea,
    addArea,
    deleteArea,
    deletePlantAreas,
    deleteOneArea,
    getAreaByName,
    updateArea
}