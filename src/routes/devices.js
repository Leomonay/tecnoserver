const express = require("express");
const {
  newDevice,
  devicesByPage,
  findById,
  getDeviceHistory,
  getDeviceFilters,
  fullDeviceOptions,
  getDevices,
  allDevices,
  devicesByLine,
  devicesByName,
  getOptions,
} = require("../controllers/deviceController");
const server = express.Router();

// server.get('/byplant', deviceListByPlant)
server.get("/", devicesByPage);
server.post("/", newDevice);
server.get("/all", allDevices);
server.get("/id", findById);
server.get("/history", getDeviceHistory);
server.get("/fullOptions", fullDeviceOptions);
server.get("/filters", getDeviceFilters);
server.post("/filters", getDevices);
server.get("/byLine/:lineName", devicesByLine);
server.get("/byName/:name", devicesByName);
server.get("/options", getOptions);
module.exports = server;
