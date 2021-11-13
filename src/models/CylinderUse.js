const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CylinderUsageSchema = Schema(
    {
        code: {
            type: String,
            required: true,
            autoPopulate: true,
        },
        intervention:{
            type: Schema.Types.ObjectId,
            required: true,
            autoPopulate: true,
            ref: "Intervention"
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