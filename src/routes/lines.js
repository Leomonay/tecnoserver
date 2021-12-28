const express = require('express')
const { getLines,addLineFromApp,deleteOneLine, getLineByName, updateLine } = require('../controllers/lineController')
const server = express.Router()

server.get('/', getLines)
server.post('/', addLineFromApp)
server.delete('/oneLine', deleteOneLine)
server.get('/getLineByName/:name', getLineByName)
server.put('/update', updateLine)

module.exports=server