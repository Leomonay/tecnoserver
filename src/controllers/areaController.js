const Area = require ('../models/Area')
const Plant = require ('../models/Plant')
// const {addItem,deleteItem} = require ('../utils/utils.js')
// const {index} = require ('../utils/tablesIndex.js')
const mongoose = require('mongoose')

async function addAreaFromApp(req,res){
    const {areas} = req.body
    let results = []
    for await (area of areas){
        const result = await addArea(area.name,area.code, area.plantName)
        results.push(result)
    }    
    res.status(200).send(results)
}

async function addArea(areaName, areaCode, plantName){
    try{
    const area = await Area({
        name: areaName,
        code: areaCode,
    })
    const areaStored = await area.save()
    const plant = await Area.findOne({code:plantName})
    await plant.areas.push(mongoose.Types.ObjectId(areaStored._id))
    await plant.save()
    }catch(e){
        return {success: false, error: e.message}
    }
    return {success: true, area: areaStored};
}

async function getAreas (req,res){
    const areas = await Area.find({}).lean().exec()
    //find: mongoose method - lean: convert to JS class - exec: execute query
    res.status(200).send({areas: areas.map(e=>e.name)})
}

async function checkArea(areaName){
    return await Area.findOne({name:areaName}).lean().exec()
}

async function deleteArea(areaName){
    try{
        const area = await Area.findOne({name:areaName})
        const plant = await Plant.findOne({area:[{name:areaName}]})
        await plant.areas.pull(area._id)
        await plant.save()
        await Area.deleteOne({name: areaName})
    }catch(e){
        return {success: false, name: areaName, error:e.message}
    }
    return {success: true, name:areaName}
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
    deletePlantAreas
}