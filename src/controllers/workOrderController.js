const WorkOrder = require ('../models/WorkOrder')
const Device = require ('../models/Device')
const WOoptions = require('../models/WOoptions')
const Line = require ('../models/Line')
const Area = require ('../models/Area')

async function getMostRecent(req, res){
    const {limit, conditions} = req.body
    const causes = (await WOoptions.findOne({ name: "Work Orders Options" })).causes

    let otList = await WorkOrder.find(conditions).sort({'registration.date':-1}).limit(limit||10).lean().populate({path:'device', model:Device}).exec()
    
    let otArray=[]
    for await (let ot of otList){
        const line = await Line.findOne({_id:ot.device.line}).lean().exec()
        const element={
            code: ot.code,
            status: ot.status,
            device: ot.device.name,
            line: line.name,
            area: (await Area.findOne({line:line._id}).lean().exec()).name, 
            description: ot.initIssue+(ot.initIssue[0]&&ot.description[0]? ' - ' : '') + ot.description,
            solicitor: ot.solicitor.name+' '+ot.solicitor.phone,
            registration: ot.registration.date,
            clientWO: ot.clientWO,
            closed: ot.closed?ot.closed.date:'',
            cause: ot.cause||'',
            macroCause: ot.cause?causes.find(e=>e.name===ot.cause).macro:''
        }
            otArray.push(element)
        }
    res.status(200).send(otArray)
}

async function getOptions(req, res){
    const options = await WOoptions.findOne({})
    res.status(200).send({
            status: options.status,
            class: options.classes,
            issue: options.issueType,
            cause: options.causes.map(e=>e.name)
        })
}

module.exports = {getMostRecent, getOptions}