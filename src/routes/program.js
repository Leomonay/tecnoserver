const express = require('express')
const {createProgram, allPrograms, updateProgram, addToProgram,getPlan, devicePlanList, updateDeviceProgram} = require('../controllers/programController')
const server = express.Router()

server.get('/', allPrograms)
server.get('/plan', getPlan)
server.get('/devices', devicePlanList)
server.post('/', createProgram)
server.put('/', updateProgram)
server.post('/devices', addToProgram)
server.put('/devices', updateDeviceProgram)

module.exports=server