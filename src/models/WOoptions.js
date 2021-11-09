const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WorkOrderOptionsSchema = Schema(
  {
    name:{
      type: String,
      autoPopulate: true
    },
    status:[{
      type: String,
      autoPopulate: true
      }],
    classes:[{
      type: String,
      autoPopulate: true
    }],
    issueType:[{
      type: String,
      autoPopulate: true
    }],
    causes:[{
        name: {type: String, autoPopulate: true},
        macro: {type: String, autoPopulate: true},
      }],                   
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("WOoptions", WorkOrderOptionsSchema);