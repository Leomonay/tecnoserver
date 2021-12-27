const express = require('express')
const { addPlant, getPlantNames, locationOptions,deletePlant, getPlantByName, updatePlant} = require('../controllers/plantController')
const server = express.Router()

server.post('/', addPlant)
server.get('/list', getPlantNames)
server.get('/locations/:plantName', locationOptions)
server.get('/getPlantByName/:name', getPlantByName)
server.delete('/delete', deletePlant)
server.put('/update', updatePlant)
// server.get('/:plantName/:areaName/:lineName/servicePoints', servicePointsByLine)

module.exports=server