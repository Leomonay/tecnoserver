const express = require('express')
const { addPlant, getPlantNames, locationOptions} = require('../controllers/plantController')
const server = express.Router()

server.post('/', addPlant)
server.get('/list', getPlantNames)
server.get('/locations/:plantName', locationOptions)
// server.get('/:plantName/:areaName/:lineName/servicePoints', servicePointsByLine)

module.exports=server