const express = require('express')
const { addPlant, getPlants } = require('../controllers/plantController')
const server = express.Router()

server.post('/', addPlant)
server.get('/', getPlants)
module.exports=server