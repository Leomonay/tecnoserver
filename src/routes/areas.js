const express = require("express");
const {
  addAreaFromApp,
  getAreas,
  deleteArea,
  deletePlantAreas,
  deleteOneArea,
  getAreaByName,
  updateArea,
} = require("../controllers/areaController");
const server = express.Router();

server.post("/", addAreaFromApp);
server.get("/", getAreas);
server.put("/", updateArea);
server.delete("/", deleteOneArea);
server.get("/getAreaByName/:name", getAreaByName);

server.delete("/", deleteArea);
server.delete("/deletePlantAreas", deletePlantAreas);

module.exports = server;
