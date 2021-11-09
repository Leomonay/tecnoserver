const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const InterventionSchema = Schema(
    {
        workOrder: {
            type: Schema.Types.ObjectId,
            ref: 'WOnumber',
            required: true
        },
        workers: [{
        type: Schema.Types.ObjectId,
        ref: 'worker',
        required: true,
        populate: true,
        }],
        tasks: {
        type: String,
        populate: true,
        },
        date: {
            type: Date,
            required: true
        },
        hours:{
            type: Number
        }
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("Intervention", InterventionSchema);