const express = require('express')
const {
    createStrategy,
    updateStrategy,
    getStrategies,
    deleteStrategy,
} = require('../controllers/strategyController')
const server = express.Router()

server.post('/',createStrategy)
server.get('/',getStrategies)
server.put('/',updateStrategy)
server.delete('/',deleteStrategy)

module.exports=server