const express = require('express')
const {
    setTasks,
    taskOrders,
    taskDeviceList,
} = require('../controllers/taskController')
const server = express.Router()

server.post('/',setTasks)
server.get('/',taskDeviceList)
server.put('/',taskOrders)

module.exports=server