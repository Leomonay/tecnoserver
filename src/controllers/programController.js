const Program = require('../models/Program')
const User = require('../models/User')
const Plant = require('../models/Plant')

async function createProgram(req, res){
    try{
        const {plant, name, people, description}  = req.body
        const workers = await User.find({idNumber: people.map(e=>e.id)})
        const newProgram = await Program({
            plant : await Plant.findOne({name:plant}),
            name,
            people: workers,
            description
        })
        newProgram.save()
        res.status(200).send(newProgram)
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function updateProgram(req, res){
    // try{
        const {id, update}  = req.body
        let program = {}
        if(update.plant) program.plant = await Plant.findOne({name: update.plant})
        if(update.name) program.name = update.name
        if(update.people) program.people = await User.find({idNumber: update.people.map(e=>e.id)})
        if(update.description) program.description = update.description

        console.log(program)

        await Program.findOneAndUpdate({_id:id},program)
        res.status(200).send({ok: "Programa actualizado"})
    // }catch(e){
    //     res.status(400).send({error: e.message})
    // }
}

async function allPrograms(req, res){
    const {plantName} = req.query
    const plant = await Plant.findOne({name: plantName}) 
    const programs = await Program.find(plant?({plant:plant._id}):{})
        .populate('people')
        .populate('plant')
    res.status(200).send(programs)
}

module.exports = {
    createProgram,
    allPrograms,
    updateProgram
}