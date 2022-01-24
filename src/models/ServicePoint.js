const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServicePointsSchema = Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    devices: [{
      type: Schema.Types.ObjectId,
      ref: "Devices",
    }],
    gate: {
      type: String,
    },
    insalubridad: {
      type: Boolean,
    },
    aceria: {
      type: Boolean,
    },
    caloria: {
      type: Boolean,
    },
    tareaPeligrosa: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ServicePoints", ServicePointsSchema);
