const express = require('express')
const {createProgram, allPrograms, updateProgram} = require('../controllers/programController')
const server = express.Router()

server.get('/', allPrograms)
server.post('/', createProgram)
server.put('/', updateProgram)

module.exports=server