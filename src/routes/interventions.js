const express = require('express')
const { addIntervention, createIntervention, updateIntervention } = require('../controllers/IntervController')
const server = express.Router()

server.post('/', createIntervention)
server.put('/', updateIntervention)
module.exports=server