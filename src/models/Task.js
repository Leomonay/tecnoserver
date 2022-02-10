const mongoose = require ('mongoose')
const Schema = mongoose.Schema;

const TaskSchema = Schema({
    strategy:{
        type: mongoose.Types.ObjectId,
        ref: 'Strategy'
    },
    device:{
        type: mongoose.Types.ObjectId,
        ref: 'Device'
    },
    frequency:{
        type: Number
    },
    // dates:[{
    //     date: {
    //         type: Date
    //     },
    //     workOrders: [{
    //         type: mongoose.Types.ObjectId,
    //         ref: 'WorkOrders'
    //     }],
    //     completed:{
    //         type: Number,
    //         range: [{
    //             type: Number,
    //             min: 0,
    //             max: 100
    //         }],
    //     }
    // }],
    cost:{
        type: Number
    },
    responsible:{
        type: mongoose.Types.ObjectId,
        ref: 'Users'
    },
    observations:{
        type: String
    },
}, {
    timestamps: true
})

module.exports=mongoose.model('Task', TaskSchema)