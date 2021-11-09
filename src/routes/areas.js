const express = require('express')
const { addAreaFromApp, getAreas,deleteArea,deletePlantAreas } = require('../controllers/areaController')
const server = express.Router()

server.post('/', addAreaFromApp)
server.get('/', getAreas)
server.delete('/', deleteArea)
server.delete('/deletePlantAreas', deletePlantAreas)

module.exports=server