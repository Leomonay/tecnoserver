const {Router} = require('express');
const plantRoutes = require('./plants');
const areaRoutes = require('./areas');
const lineRoutes = require ('./lines')
const userRoutes = require ('./users')
const workOrderRoutes = require('./workOrders')
const deviceRoutes = require('./devices')

const csvRoutes = require ('../loadFromCsv/csvRoutes')
   
const server = Router();

server.use('/plants',plantRoutes)
server.use('/areas',areaRoutes)
server.use('/lines',lineRoutes)
server.use('/devices',deviceRoutes)
server.use('/users',userRoutes)
server.use('/csvupdate', csvRoutes)
server.use('/workorder', workOrderRoutes)

module.exports = server;