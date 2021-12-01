const Line = require ('../models/Line')

async function servicePointsByLine(req, res){
    const {lineName} = req.params
    const lines = await Line.findOne({name:lineName})
    .populate({path:'ServicePoints', select: 'name'})
    res.status(200).send(lines.ServicePoints.map(sp=>sp.name))
}

module.exports={
    servicePointsByLine
}