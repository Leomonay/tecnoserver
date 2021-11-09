const express = require('express')
const {getDeviceFilters, getDevices, allDevices} = require('../controllers/deviceController')
const server = express.Router()

// server.get('/byplant', deviceListByPlant)
server.get('/',allDevices)
server.get('/filters', getDeviceFilters)
server.post('/filters', getDevices)
module.exports=server