const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CylinderSchema = Schema(
    {
        code: {
        type: String,
        required: true,
        autoPopulate: true,
        unique: true,
        },
        refrigerant: {
            type: Schema.Types.ObjectId,
            required: true,
            autoPopulate: true,
            ref: "Refrigerante",
        },
        initialStock:{
            type: Number,
            autoPopulate: true,
        },
        assignedTo:{
            type: Schema.Types.ObjectId,
            autoPopulate: true,
            ref: "User",  
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Cylinder", CylinderSchema);
