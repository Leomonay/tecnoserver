const express = require('express')
const { getDates,addDates,getPlan } = require('../controllers/taskDateController')
const server = express.Router()

server.get('/', getDates)
server.post('/', addDates)
server.get('/plan', getPlan)

module.exports=server