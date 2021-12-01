const express = require('express')
const { addUser, getWorkers, login, getUserData, updateUser, getSupervisors} = require('../controllers/userController')
const server = express.Router()

server.post('/', addUser)
server.post('/detail/:idNumber', updateUser)
server.get('/workers', getWorkers)
server.get('/supervisors', getSupervisors)
server.get('/userByToken', getUserData)
server.post('/auth', login)
module.exports=server
