const express = require('express')
const { addUser, getWorkers } = require('../controllers/userController')
const server = express.Router()

server.post('/', addUser)
server.get('/workers', getWorkers)
module.exports=server
