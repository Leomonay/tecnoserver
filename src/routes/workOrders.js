const express = require('express')
const { getMostRecent, getOptions ,addOrder} = require('../controllers/workOrderController')
const server = express.Router()

server.post('/mostrecent', getMostRecent)
server.get('/options', getOptions)
server.post('/', addOrder)

module.exports=server
