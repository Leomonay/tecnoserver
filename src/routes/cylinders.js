const express = require("express");
const {
  getCylinders,
  getRefrigerant,
  postUsage,
  createCylinder,
  addUsageCylinder,
  updateCylinder,
  deleteCylinder,
  deleteCylinderUsage
} = require("../controllers/CylinderController");
const server = express.Router();

// server.get("/list", getCylinders);
server.get("/",getCylinders)
server.get("/refrigerant", getRefrigerant);
server.post("/usage", postUsage);
server.post("/", createCylinder);
server.post("/usages", addUsageCylinder);
server.delete("/usages", deleteCylinderUsage);
server.put("/update", updateCylinder);
server.delete("/delete", deleteCylinder);

module.exports = server;
