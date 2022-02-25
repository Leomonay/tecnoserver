const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CylinderUsageSchema = Schema(
    {
        cylinder: {
            type: Schema.Types.ObjectId,
            required: true,
            autoPopulate: true,
            ref: 'Cylinder'
        },
        intervention:{
            type: Schema.Types.ObjectId,
            required: true,
            autoPopulate: true,
            ref: "Intervention"
        },
        user:{
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Users"
        },
        consumption:{
            type: Number,
            autoPopulate: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("CylinderUse", CylinderUsageSchema);