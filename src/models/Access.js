const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  access: {type: String, required: true, unique: true},
  permissions: {type: String, required: true},
  access: {type: String, enum: ["view","client","worker","intern","supervisor","admin"]},
  active: {type:Boolean}
},
{
  timestamps: true,
});

module.exports = mongoose.model("Users", userSchema);