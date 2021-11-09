const express = require('express')
const { getMostRecent, getOptions } = require('../controllers/workOrderController')
const server = express.Router()

server.post('/mostrecent', getMostRecent)
server.get('/options', getOptions)

module.exports=server
