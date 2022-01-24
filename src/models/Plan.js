const mongoose = require ('mongoose')
const Schema = mongoose.Schema;

const PlanSchema = Schema({
    device:{
        type: mongoose.Types.ObjectId,
        ref: 'Device'
        },
    program:{
        type: mongoose.Types.ObjectId,
        ref: 'Program'
    },

    observations:{
        type: String
    },
    date:{
        type: Date,
    },
    responsible:{
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    workOrders:[{
        type: mongoose.Types.ObjectId,
        ref: 'WorkOrder'
    }],
}, {
    timestamps: true
})

module.exports=mongoose.model('Plan', PlanSchema)