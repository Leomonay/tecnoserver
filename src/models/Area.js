const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AreaSchema = Schema(
  {
    name: {
      type: String,
      required: true,
      autoPopulate: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    lines: [{
      type: Schema.Types.ObjectId,
      autopopulate: true,
      ref: "Line",
    }],
    plant:{
      type: Schema.Types.ObjectId,
      populate: true,
      ref: "Plant",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Area", AreaSchema);
