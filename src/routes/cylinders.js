const express = require('express')
const {postUsage, createCylinder} = require('../controllers/CylinderController')
const server = express.Router()

server.post('/usage', postUsage)
server.post('/', createCylinder)
    
module.exports=server