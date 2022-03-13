const express = require("express");
const {
  getServicePoints,

  servicePointsByLine,
  addSPFromApp,
  deleteOneServicePoint,
  getSPByName,
  updateServicePoint,
} = require("../controllers/servicePointController");
const server = express.Router();

server.get('/',getServicePoints)

server.get("/byLine/:lineName", servicePointsByLine);
server.post("/", addSPFromApp);
server.delete("/oneServicePoint", deleteOneServicePoint);
server.get("/getSPByName/:name", getSPByName);
server.put("/update", updateServicePoint);

module.exports = server;
