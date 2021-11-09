const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DeviceOptionsSchema = Schema(
  {
    name:{
      type: String,
      autoPopulate: true,
      unique: true
    },
    types:[{
      type: String,
      autoPopulate: true
    }],
    units:[{
        type:String,
        autoPopulate: true
    }],
    service:[{
        type:String,
        autoPopulate: true
    }],
    status:[{
        type:String,
        autoPopulate: true
    }],
    category:[{
        type:String,
        autoPopulate: true
    }],
    environment:[{
        type:String,
        autoPopulate: true
    }],
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Options", DeviceOptionsSchema);