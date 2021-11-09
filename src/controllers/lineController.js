const Line = require ('../models/Line')
const Area = require ('../models/Area')
// const {index} = require ('../utils/tablesIndex.js')
// const {addItem} = require ('../utils/utils.js')

async function checkLine(lineName){
    return line.check(lineName)
}

async function getLines (req,res){
    const lines = await Line.find().lean().exec()
    res.status(200).send({lines: lines.map(e=>[e.name, e.area.name])})
}

module.exports={
    getLines,
    checkLine,
}