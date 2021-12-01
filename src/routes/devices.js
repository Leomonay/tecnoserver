const express = require('express')
const {getDeviceFilters, getDevices, allDevices, devicesByLine, devicesByName} = require('../controllers/deviceController')
const server = express.Router()

// server.get('/byplant', deviceListByPlant)
server.get('/',allDevices)
server.get('/filters', getDeviceFilters)
server.post('/filters', getDevices)
server.get('/byLine/:lineName', devicesByLine)
server.get('/byName/:name', devicesByName)
module.exports=server