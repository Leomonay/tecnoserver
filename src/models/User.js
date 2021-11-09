const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserOptions = require ('./UserOptions')

const options = UserOptions.findOne

const userSchema = new Schema({
  username: {type: String, required: true, unique: true},
  password: {type: String},
  name: {type: String, required: true},
  idNumber: {type: Number},
  access: {type: String, enum: options.access},
  charge: {type: String, enum: options.charge},
  email: {type: String},
  phone: {type: String},
  plant: {type: Schema.Types.ObjectId, ref: 'plant'},
  active: {type:Boolean}
},
{
  timestamps: true,
});

module.exports = mongoose.model("Users", userSchema);