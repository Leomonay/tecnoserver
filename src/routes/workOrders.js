const express = require('express')
const { getMostRecent, getOptions, addOrder, getWObyId} = require('../controllers/workOrderController')
const server = express.Router()

server.post('/mostrecent', getMostRecent)
server.get('/options', getOptions)
server.get('/detail/:idNumber', getWObyId)
server.post('/', addOrder)

module.exports=server
