const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const WOoptions = require ("./WOoptions")

const options = WOoptions.findOne({name: "Work Orders Options"}).lean().exec()

const WorkOrderSchema = Schema(
  {
    code: {
      type: Number,
      required: true,
      unique: true,
    },
    device:{
        type: Schema.Types.ObjectId,
        ref: 'Device',
        autoPopulate: true
    },
    servicePoint:{
        type: Schema.Types.ObjectId,
        ref: 'ServicePoints'
    },
    status:{
        type: String,
        enum: options.status
    },
    class: {
      type: String,
      enum: options.class,
      autoPopulate: true,
    },
    initIssue:{
        type: String,
        autoPopulate: true,
    },
    solicitor:{
        name: {type: String},
        phone: {type: String}
    },
    registration:{
        date:{type: Date},
        user:{type: Schema.Types.ObjectId, ref:'Users'}
    },
    clientWO:{
        type: String
    },
    supervisor:{
        type: Schema.Types.ObjectId, // from table Users
        ref: 'Users' 
    },
    description: {
        type: String,
    },
    cause: {
        type: String,
        enum: options.causes
    },
    // macroCause: Dato de causes

    interventions:[{
        type: Schema.Types.ObjectId, // delete from schema  
        ref: 'Intervention', 
    }],
    clientConforming:{
        type: Boolean
    },
    closed:{
        date: {type: Date},
        user: {
            type: Schema.Types.ObjectId, // from table Users
            ref: 'Users'
        }
    },
    completed:{
        type:Number,
        range: [{
            type: Number,
            min: 0,
            max: 100
        }],
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WorkOrders", WorkOrderSchema);