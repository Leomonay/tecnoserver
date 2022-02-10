const User = require('../models/User')
const Plant = require('../models/Plant')
const Strategy = require('../models/Strategy')

function buildStrategies(strategies){
    return (strategies.map(
        strategy=>{
            let {name, year, description} = strategy
            const newItem = {name, year, description}
            newItem.plant = strategy.plant.name
            newItem.supervisor = {
                id: strategy.supervisor.idNumber, 
                name: strategy.supervisor.name
            }
            newItem.people = strategy.people.map(worker=>({id: worker.idNumber, name: worker.name}))
            return newItem
        }
    ))
}

async function createStrategy(req, res){
    try{
        const {name, people, year, description}  = req.body
        const plant = ( await Plant.findOne({name: req.body.plant}) )._id
        const checkStrategy = await Strategy.findOne({name, year, plant: plant._id})
        if (checkStrategy) throw new Error ('La estrategia ya existe para esa planta y ese año')
        const supervisor = await User.findOne({idNumber: req.body.supervisor})
        const workers = await User.find({idNumber: people})
        const data = {
            plant,
            year,
            name,
            description,
            supervisor: supervisor? supervisor._id : undefined,
            people: workers? workers.map(e=>e._id) : undefined,
        }
        const newStrategy = await Strategy(data)
        newStrategy.save()
        res.status(200).send({
            ...data,
                plant: plant.name,
                supervisor: {id: supervisor.idNumber, name: supervisor.name},
                people: workers?
                    workers.map(worker=>({id: worker.idNumber, name: worker.name}))
                    : undefined
        })
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function updateStrategy(req, res){
    try{
        const {previous,update} = req.body
        let {plant, year, name} = previous
        plant = await Plant.findOne({name: plant})
        update.plant = plant._id
        if (update.supervisor) update.supervisor = await User.findOne({idNumber: update.supervisor.id}) 
        if (update.people) update.people = await User.find({idNumber: update.people})
        for (let key of ['name', 'description', 'supervisor', 'people']){
            if (!update[key]) throw new Error (`Debe indicarse ${key}`)
        }
        const checkStrategy = await Strategy.findOne({plant:plant._id, name, year})
        if (checkStrategy){
            await Strategy.findByIdAndUpdate(checkStrategy._id,{
                ...update,
                    supervisor: update.supervisor._id,
                    people: update.people.map(worker=>worker._id)
                }
            )
        }else{
            throw Error ('Estrategia no encontrada')
        }
        res.status(200).send({
            ...update,
            plant: plant.name,
            supervisor: {id: update.supervisor.idNumber, name: update.supervisor.name},
            people: update.people.map(worker=>({id: worker.idNumber, name: worker.name}))
        })
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function getStrategies(req, res){
    try{
        const {year} = req.query
        const plant = ( await Plant.find(req.query.plant?{name: req.query.plant}:{}) ).map(plant=>plant._id)
        const filters = {plant}
        if(year)filters.year=year
        const strategies = await Strategy.find(filters)
            .populate(['plant', 'supervisor', 'people'])
        res.status(200).send(buildStrategies(strategies))
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function deleteStrategy(req, res){
    try{
        const {year, name} = req.body
        const plant = await Plant.findOne({name:req.body.plant})._id
        const strategy = await Strategy.findOne({plant, year, name})
        await Strategy.findByIdAndDelete(strategy._id)
        const strategies = await Strategy.find(filters)
            .populate(['plant', 'supervisor', 'people'])
        res.status(200).send(buildStrategies(strategies))
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

module.exports = {
    createStrategy,
    updateStrategy,
    getStrategies,
    deleteStrategy
}