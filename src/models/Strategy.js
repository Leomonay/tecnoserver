const mongoose = require ('mongoose')
const Schema = mongoose.Schema;

const StrategySchema = Schema({
    plant:{
        type: mongoose.Types.ObjectId,
        ref: 'Plant'
    },
    year:{
        type: Number
    },    
    name:{
        type:String,
        required: true,
    },
    description:{
        type: String,
        populate: true
    },
    supervisor:{
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        },
    people:[{
        type: mongoose.Types.ObjectId,
        ref: 'Users',
        populate: true,
    }]
}, {
    timestamps: true
})

module.exports=mongoose.model('Strategy', StrategySchema)