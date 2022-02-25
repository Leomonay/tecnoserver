const express = require('express')
const { addUser, getWorkers, login, getUsersList, getUserData, updateUser, getSupervisors, getUserOptions, filterUser} = require('../controllers/userController')
const server = express.Router()

server.get('/', getUsersList)
// server.get('/workers', getWorkers)
// server.get('/supervisors', getSupervisors)
server.get('/userByToken', getUserData)
server.get('/options', getUserOptions)
server.post('/', addUser)
server.post('/filtered', filterUser)
server.post('/detail/:idNumber', updateUser)
server.post('/auth', login)
module.exports=server
