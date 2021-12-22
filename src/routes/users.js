const express = require('express')
const { addUser, getWorkers, login, getUsersList, getUserData, updateUser, getSupervisors, getUserOptions, filterUser} = require('../controllers/userController')
const server = express.Router()

server.post('/', addUser)
server.post('/filtered', filterUser)
server.get('/', getUsersList)
server.post('/detail/:idNumber', updateUser)
server.get('/workers', getWorkers)
server.get('/supervisors', getSupervisors)
server.get('/userByToken', getUserData)
server.post('/auth', login)
server.get('/options', getUserOptions)
module.exports=server
