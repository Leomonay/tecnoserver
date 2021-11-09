const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userOptionsSchema = new Schema({
  name: {type: String, required: true},
  access: [{type: String}],
  charge: [{type: String}]
},
{
  timestamps: true,
});

module.exports = mongoose.model("UserOptions", userOptionsSchema);