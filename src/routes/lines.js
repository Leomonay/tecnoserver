const express = require('express')
const { getLines } = require('../controllers/lineController')
const server = express.Router()

server.get('/', getLines)
module.exports=server