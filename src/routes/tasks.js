const express = require('express')
const {
    setTasks,
    taskDeviceList,
    addOrderToTask
} = require('../controllers/taskController')
const server = express.Router()

server.post('/',setTasks)
server.get('/',taskDeviceList)
server.post('/order',addOrderToTask)

module.exports=server