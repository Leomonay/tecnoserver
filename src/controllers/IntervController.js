const User = require ('../models/User')
const WorkOrder = require ('../models/WorkOrder')
const Intervention = require('../models/Intervention')
const {getDate, collectError, fromCsvToJson, finalResults} = require('../utils/utils')

async function addIntervention(workOrderNumber, workerIDs , tasks, date, hours){
    let results = { ok: [], errors: [] };
    try{
        const workOrder = await WorkOrder.findOne({code:workOrderNumber})
        
        let workers = await User.find({ idNumber : workerIDs }).lean().exec()
        
        if( new Date(date) !== date ){date=new Date(date)}

        const newItem = await Intervention({
            workOrder,
            workers: workers.map(e=>e._id),
            tasks,
            date: new Date(date),
            hours
        })
        await newItem.save()
        workOrder.interventions = workOrder.interventions? [...workOrder.interventions, newItem._id] : [newItem._id]
        await workOrder.save()

        results.ok.push([workOrderNumber, date, tasks])
    }catch(e){
        console.error(e.message)
        collectError(results.errors, e.message, 'Intervention', workOrderNumber);
    }
    return finalResults('Intervention', results);
}

async function createIntervention(req,res){
    let {workOrderNumber, workerIDs , tasks, date, hours} = req.body
    try{
        const newIntervention = await addIntervention(workOrderNumber, workerIDs , tasks, date, hours)
        res.status(200).send(newIntervention)
    }catch(e){
        res.status(400).send({error: e.message})
    }
}

async function loadInterventionFromCsv(){
    let results = { ok: [], errors: [] };
    //first, tasks and hours are got from the Work Orders .csv file
    const OTtasks = await fromCsvToJson('OT.csv',(row)=>{
        return{code: row.Nro_OT,
            tasks:row['Descripción_OT'],
            hours:row.Horas_demandadas        
        }
        },[])
    //then, an arrays of bodies is built from both .csv files
    const itemsToAdd = await fromCsvToJson('OT-INTERVINIENTE.csv', (row)=>{
        let body={}
        let ot = OTtasks.find(e=>e.code==row.OT)
        if(ot)if(typeof ot.hours == 'string') ot.hours = Number(ot.hours.replace(',','.'))
        
        body.workOrderNumber= row.OT
        body.workerIDs= [row.Personal]
        body.tasks= ot?ot.tasks:null
        body.date= getDate(row.Fecha)
        body.hours= ot? ot.hours :null
        
        return{body}
    }, []);

    // with the array, the interventions are generated:
    for await (let element of itemsToAdd){
        try{
            //first the workOrder._id is set, and the date, in order to find the intervention.
            const workOrder = (await WorkOrder.findOne({code: element.body.workOrderNumber}))
                , {date}=element.body
            if(!workOrder){
                collectError(
                    results.errors,
                    'la OT no existe en Base de Datos',
                    'Interventions',
                    [element.body.workOrderNumber, element.body.date])
            }else{
                // console.log('OT._id: ', workOrder._id)
                const {workOrderNumber, workerIDs , tasks, date, hours} = element.body
                const interventions = await Intervention.find({_id : workOrder.interventions})
                
                // const interventions = await Intervention.find({workOrder: workOrder._id}).lean().exec()
                
                if(interventions.length==0){
                    // si no existen intervenciones en esa OT, crearla
                    let result= await addIntervention(workOrderNumber, workerIDs , tasks, date, hours)
                    //guardar el resultado en la recopilación de resultados 
                    result.ok? results.ok.push(result.ok[0]):results.errors.push('error desconocido')

                }else if(interventions.find(e=>e.date.getTime()==date.getTime())){
                    // si existe una intervención con esa fecha, agregar trabajadores
                    const workerId = (await User.findOne({idNumber: element.body.workerIDs[0]}))._id
                    const actualIntervention = await Intervention.findOne({workOrder: workOrder._id, date: date.getTime()})
                    if (!actualIntervention.workers.includes(workerId)){
                        await Intervention.updateOne(
                            {workOrder: workOrder._id, date: date.getTime()},
                            {$push: {workers: workerId}
                        })
                        results.ok.push([element.body.workOrderNumber, date])
                    }else{
                        collectError(
                            results.errors,
                            'El interviniente ya se encuetra en esa OT, en esa fecha',
                            'Interventions',
                            element.body.workOrderNumber)
                    }
                }else{
                    // si no existe una intervención con esa fecha, borrar tasks en tareas anteriores
                    interventions.map(async(intervention)=>{
                        if(intervention.date.getTime()<date.getTime()){
                            await Intervention.updateOne(
                                {workOrder: workOrder._id, date: intervention.date.getTime()},
                                {$unset: {tasks: 1}})

                        }else if(intervention.date.getTime()>date.getTime()){
                            element.body.tasks=undefined;
                        }
                        results.ok.push([element.body.workOrderNumber, date])
                    })

                    // y crear la nueva
                    const newIntervention = await addIntervention(workOrderNumber, workerIDs , tasks, date, hours)
                    results.ok.push( newIntervention )
                }
            }
        }catch(e){
            collectError(results.errors,e.message,'Interventions', element.body.workOrderNumber)
        }
    }
    results.ok=results.ok.length
    return results
}




module.exports={addIntervention, loadInterventionFromCsv, createIntervention}