const express = require('express')
const { getMostRecent, getOptions, addOrder, getWObyId, getWOList} = require('../controllers/workOrderController')
const server = express.Router()

server.post('/mostrecent', getMostRecent)
server.post('/list',getWOList)
server.get('/options', getOptions)
server.get('/detail/:idNumber', getWObyId)
server.post('/', addOrder)

module.exports=server
