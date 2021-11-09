const Plant = require ('../models/Plant')

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

async function getPlants (req,res){
    const plants = await Plant.find().lean().exec()
    var array=[]
    plants.map(e=>array.push({
        Planta: e.name,
        Areas: e.areas.map(area=>area.name)
    }))
    console.log(plants)
    res.status(200).send(array)
}

module.exports={
    addPlant,
    getPlants,
    getPlantByCode,
    getPlantByName
}