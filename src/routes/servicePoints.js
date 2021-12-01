const express = require('express')
const { servicePointsByLine } = require('../controllers/servicePointController')
const server = express.Router()

server.get('/byLine/:lineName', servicePointsByLine)
module.exports=server