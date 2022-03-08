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
server.post("/", createCylinder);
server.delete("/", deleteCylinder);
server.put("/", updateCylinder);
server.get("/refrigerant", getRefrigerant);
server.post("/usage", postUsage);
server.post("/usages", addUsageCylinder);
server.delete("/usages", deleteCylinderUsage);

module.exports = server;
