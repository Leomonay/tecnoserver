const mongoose = require ('mongoose')
const Schema = mongoose.Schema;

const ProgramSchema = Schema({
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
        unique: true
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
    }],
    deviceList:[{
        device:{
            type: mongoose.Types.ObjectId,
            ref: 'Device',
            required: true
        },
        frequency:{
            type: Number
        },
        planned:[{
            date: {type: Date},
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
        }],
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
        completed:{
            type: Number,
            range: [{
                type: Number,
                min: 0,
                max: 100
            }],
        }
    }]
}, {
    timestamps: true
})

module.exports=mongoose.model('Program', ProgramSchema)