const mongoose = require ('mongoose')
const Schema = mongoose.Schema;

const ProgramSchema = Schema({
    plant:{
        type: mongoose.Types.ObjectId,
        ref: 'Plant',
        required: true
    },
    name:{
        type:String,
        required: true,
    },
    people:[{
        type: Schema.Types.ObjectId,
        ref: 'Users',
        populate: true,
    }],
    description:{
        type: String,
        populate: true
    }
}, {
    timestamps: true
})

module.exports=mongoose.model('Program', ProgramSchema)