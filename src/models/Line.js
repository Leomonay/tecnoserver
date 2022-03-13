const mongoose = require ('mongoose')
const Schema = mongoose.Schema;

const LineSchema = Schema({
    name:{
        type: String,
        required: true,
        unique: true,
        autopopulate: true,
    },
    area:{
        type: Schema.Types.ObjectId,
        ref: "Area",
        autopopulate: true,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique:true
    },
    ServicePoints:[{
        type: Schema.Types.ObjectId,
        ref: "ServicePoints"
    }]
}, {
    timestamps: true
})

module.exports=mongoose.model('Line', LineSchema)