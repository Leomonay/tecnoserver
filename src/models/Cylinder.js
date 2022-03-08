const { type } = require("express/lib/response");
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
        givenDate:{
            type: Date

        },
        initialStock:{
            type: Number,
            autoPopulate: true,
        },
        assignedTo:{
            type: Schema.Types.ObjectId,
            ref: "Users",  
        },
        status:{
            type: String,
            enum:["Nueva", // en Stock
            "En uso", // Asignada
            "Vacia", // Sin Stock
            "Descartada" // Destruida
        ],
            autoPopulate: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Cylinder", CylinderSchema);
