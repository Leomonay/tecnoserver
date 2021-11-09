const mongoose = require ('mongoose')
const Schema = mongoose.Schema;

const LineSchema = Schema({
    name:{
        type: String,
        required: true,
        autopopulate: true,
    },
    area:{
        type: Schema.Types.ObjectId,
        ref: "Area",
        autopopulate: true
    },
    code: {
        type: String,
        required: true,
    },
    ServicePoints:[{
        type: Schema.Types.ObjectId,
        ref: "ServicePoints"
    }]
}, {
    timestamps: true
})

module.exports=mongoose.model('Line', LineSchema)