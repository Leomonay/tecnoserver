const express = require('express')
const {allDevices, getOptions,createDevice,deleteDevice, updateDevice} = require('../controllers/abmDevices')
const server = express.Router()

// server.get('/byplant', deviceListByPlant)
server.get('/devicelist',allDevices)
server.get('/options', getOptions)
server.post('/', createDevice)
server.delete("/delete", deleteDevice);
server.put("/update", updateDevice);



// server.get('/filters', getDeviceFilters)
// server.get('/byLine/:lineName', devicesByLine)
// server.get('/byName/:name', devicesByName)
module.exports=server