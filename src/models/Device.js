const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Opciones = require ('./DeviceOptions')

const options = Opciones.findOne({name: "DeviceFeatures"}).lean().exec()

const DeviceSchema = Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      autoPopulate: true,
    },
    type: {
      type: String,
      enum: options.types,
      autoPopulate: true
    },
    power: {
      magnitude: {
        type: Number,
        autoPopulate: true
      },
      unit: {
        type: String,
        enum: options.units,
        autoPopulate: true
      },
    },
    refrigerant:{
        type: Schema.Types.ObjectId,
        ref: 'Refrigerante',
        autoPopulate: true
    },
    extraDetails:{
      type: String,
      autoPopulate: true
    },
    service: {
      type: String,
      enum: options.service,
      autoPopulate: true
    },
    status: {
        type: String,
        enum: options.status,
        autoPopulate: true
    },
    category:{
      type: String,
      enum: options.category,
      autoPopulate: true
  },
  regDate:{
        type: Date,
    },
    environment:{
      type: String,
      enum: options.environment,
      autoPopulate: true
    },
    line: {
      type: Schema.Types.ObjectId,
      ref: 'Line',
      autoPopulate: true
    },
    servicePoints: [{
      type: Schema.Types.ObjectId,
      ref: 'ServicePoints',
      populate: true,
    }],
      active:{
        type: Boolean
    }
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Device", DeviceSchema);