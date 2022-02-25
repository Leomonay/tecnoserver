const mongoose = require ('mongoose')
const Schema = mongoose.Schema;

const RefrigeranteSchema = Schema({
    code: {
        type: String,
        unique: true,
        required: true,
    },
    refrigerante:{
        type: String,
        required: true,
        unique: true,
        autopopulate: true,
    }, // migrate to "name"
    active:{
        type: Boolean
    }
}, {
    timestamps: true
})

module.exports=mongoose.model('Refrigerante', RefrigeranteSchema)