const express = require('express')
const {
    setTasks,
    taskDeviceList
} = require('../controllers/taskController')
const server = express.Router()

server.post('/',setTasks)
server.get('/',taskDeviceList)

module.exports=server