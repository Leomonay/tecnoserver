const express = require('express')
const { addIntervention, createIntervention } = require('../controllers/IntervController')
const server = express.Router()

server.post('/', createIntervention)
module.exports=server