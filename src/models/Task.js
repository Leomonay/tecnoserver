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