const express = require("express");
const {
  getCylinders,
  getRefrigerant,
  postUsage,
  createCylinder,
  addUsageCylinder,
  updateCylinder,
  deleteCylinder,
} = require("../controllers/CylinderController");
const server = express.Router();

server.get("/list", getCylinders);
server.get("/refrigerant", getRefrigerant);
server.post("/usage", postUsage);
server.post("/", createCylinder);
server.post("/addUsageCylinder", addUsageCylinder);
server.put("/update", updateCylinder);
server.delete("/delete", deleteCylinder);

module.exports = server;
