const express = require('express')
const {planDeviceList, addToPlan} = require('../controllers/planController')
const server = express.Router()

// server.get('/devices',planDeviceList)
// server.post('/',addToPlan)

module.exports=server