const User = require('../models/User')
const Plant = require('../models/Plant')
const Strategy = require('../models/Strategy')

function buildStrategy(strategy){
    let {_id, name, year, description} = strategy
    const newItem = {id:_id, name, year, description}
    newItem.plant = strategy.plant.name
    newItem.supervisor = {
        id: strategy.supervisor.idNumber, 
        name: strategy.supervisor.name
    }
    newItem.people = strategy.people.map(worker=>({id: worker.idNumber, name: worker.name}))
    return newItem
}

async function createStrategy(req, res){
    try{
        const {name, people, year, description}  = req.body
        const plant = ( await Plant.findOne({name: req.body.plant}) )._id
        const checkStrategy = await Strategy.findOne({name, year, plant: plant._id})
        if (checkStrategy) throw new Error ('La estrategia ya existe para esa planta y ese año')
        const supervisor = await User.findOne({idNumber: Number(req.body.supervisor)})
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
        console.log(e)
        res.status(400).send({error: e.message})
    }
}

async function updateStrategy(req, res){
    try{
        const strategy = req.body

        console.log(strategy)
        const update ={}
        if (strategy.plant) update.plant = (await Plant.findOne({name: strategy.plant}))._id
        if (strategy.supervisor) update.supervisor = ( await User.findOne({idNumber: Number(strategy.supervisor.id || strategy.supervisor)}) )._id 
        if (strategy.people) update.people = ( await User.find({idNumber: strategy.people.map(e=>e.id || e)}) ).map(u=>u._id)
        if (strategy.description) update.description = strategy.description
        if (strategy.year) update.year = Number(strategy.year)

        console.log('update', update)

        await Strategy.findByIdAndUpdate(strategy.id,update)

        const updated = await Strategy.findById(strategy.id).populate(['plant','supervisor', 'people'])

        console.log('buildStrategies([updated])',buildStrategy(updated))

        res.status(200).send(buildStrategy(updated))
    }catch(e){
        console.log(e)
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
        res.status(200).send(strategies.map(buildStrategy))
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
        res.status(200).send(strategies.map(buildStrategy))
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