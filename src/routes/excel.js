const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const express = require("express");
const { buildExcel, loadFromExcel } = require("../controllers/ExcelController");
const server = express.Router();

server.get("/", buildExcel);
server.post("/", loadFromExcel);

module.exports = server;
