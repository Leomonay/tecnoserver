const {Router} = require('express');

const plantRoutes = require('./plants');
const areaRoutes = require('./areas');
const lineRoutes = require ('./lines')
const spRoutes = require('./servicePoints')
const userRoutes = require ('./users')
const workOrderRoutes = require('./workOrders')
const deviceRoutes = require('./devices')
const interventionRoutes = require('./interventions')
const cylinderRoutes = require('./cylinders')
const abmDevicesRoutes = require('./abmdevices')
const strategiesRoutes = require('./strategies')
const taskRoutes = require('./tasks')
const csvRoutes = require ('../loadFromCsv/csvRoutes')
const datesRoutes = require('./dates')


const server = Router();

server.use('/plants',plantRoutes)
server.use('/areas',areaRoutes)
server.use('/lines',lineRoutes)
server.use('/servicePoints',spRoutes)
server.use('/devices',deviceRoutes)
server.use('/users',userRoutes)
server.use('/workorder', workOrderRoutes)
server.use('/intervention', interventionRoutes)
server.use('/cylinders', cylinderRoutes)
server.use('/abmdevices', abmDevicesRoutes)
server.use('/strategies', strategiesRoutes)
server.use('/tasks', taskRoutes)
server.use('/csvupdate', csvRoutes)
server.use('/dates', datesRoutes)

module.exports = server;