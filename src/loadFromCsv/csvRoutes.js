const {Router} = require('express');
const {loadAreasFromCsv,
    loadLinesFromCsv,
    loadGasesFromCsv,
    createDeviceOptions,
    loadDevicesFromCsv,
    loadServicePointsFromCsv,
    loadRelationEqLsFromCsv,
    updateData} = require('./csvDeviceController')
const {createUserOptions, createUsers, createWOoptions, loadOTfromCsv} = require('./csvOTController')
const {loadInterventionFromCsv} = require('../controllers/IntervController')

const server = Router();

server.post('/areas', async (req,res)=>{
    let results=[]
    try{
        results.push( await loadAreasFromCsv())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

server.post('/lines', async (req,res)=>{
    let results=[]
    try{
        results.push( await loadLinesFromCsv())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

server.post('/servicepoints', async (req,res)=>{
    let results=[]
    try{
        results.push( await loadServicePointsFromCsv())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

server.post('/gases', async (req,res)=>{
    let results=[]
    try{
        results.push( await loadGasesFromCsv())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

server.post('/deviceoptions', async (req,res)=>{
    let results=[]
    try{
        results.push( await createDeviceOptions())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

server.post('/devices', async (req,res)=>{
    let results=[]
    try{
        results.push( await loadDevicesFromCsv())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

server.post('/relationeqls', async (req,res)=>{
    let results=[]
    try{
        results.push( await loadRelationEqLsFromCsv())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

server.post('/wooptions', async (req,res)=>{
    let results=[]
    try{
        results.push( await createWOoptions())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

server.post('/useroptions', async (req,res)=>{
    let results=[]
    try{
        results.push( await createUserOptions())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

server.post('/users', async (req,res)=>{
    let results=[]
    try{
        results.push( await createUsers())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

server.post('/workorders', async (req,res)=>{
    let results=[]
    try{
        results.push( await loadOTfromCsv())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

server.post('/interventions', async (req,res)=>{
    let results=[]
    try{
        results.push( await loadInterventionFromCsv())
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})


module.exports = server;

server.post('/', async (req,res)=>{
    try{
        var results=[]
        // results.push( await loadAreasFromCsv())
        // results.push( await loadLinesFromCsv())
        // results.push( await loadServicePointsFromCsv())
        // results.push( await loadGasesFromCsv())
        // results.push(await createDeviceOptions())
        // results.push(await loadDevicesFromCsv())
        // results.push(await loadRelationEqLsFromCsv())
        // results.push(await createWOoptions())
        // results.push(await createUserOptions())
        // results.push(await createUsers())
        // results.push(await loadOTfromCsv())
        // results.push( await loadInterventionFromCsv())
        results.push(await updateData())

        //consumos de gases
        //intervenciones
        res.status(200).send(results)
    }catch(e){
        res.status(500).send(e.message)
    }
})

module.exports = server;