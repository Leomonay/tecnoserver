const mongoose = require ('mongoose')
const Schema = mongoose.Schema;

const TaskDateSchema = Schema({
    task:{
        type: mongoose.Types.ObjectId,
        ref: 'Task'
    },
    date: {
        type: Date
    },
    workOrders: [{
        type: mongoose.Types.ObjectId,
        ref: 'WorkOrders'
    }],
    completed:{
        type: Number,
        range: [{
            type: Number,
            min: 0,
            max: 100
        }],
    }
})

module.exports=mongoose.model('TaskDate', TaskDateSchema)