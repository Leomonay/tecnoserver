const mongoose = require ('mongoose')
const Schema = mongoose.Schema;

const RefrigeranteSchema = Schema({
    code: {
        type: String,
        required: true,
    },
    refrigerante:{
        type: String,
        required: true,
        autopopulate: true,
    },
}, {
    timestamps: true
})

module.exports=mongoose.model('Refrigerante', RefrigeranteSchema)